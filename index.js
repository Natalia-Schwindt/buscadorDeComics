// Variables globales que almacenan referencias a elementos del DOM
const root = document.getElementById("root"); // Contenedor donde se mostrarán los resultados (tarjetas de personajes/cómics)
const paginaActualSpan = document.getElementById("pagina-actual"); // Mostrará el número de página actual
const totalPaginasSpan = document.getElementById("total-paginas"); // Mostrará el total de páginas
const resultadosSpan = document.getElementById("resultados"); // Mostrará el número total de resultados

// Variables para controlar la paginación
let pagina = 1;
let total = 0;

// Referencias a elementos interactivos del DOM
const tipoSelect = document.getElementById("tipo"); // Select para elegir entre personajes o cómics
const ordenSelect = document.getElementById("orden"); // Select para elegir el criterio de ordenación
const searchInput = document.querySelector("input"); // Input de búsqueda

// Referencias a los botones de paginación
const nextPage = document.getElementById("next-page"); // Botón para ir a la siguiente página
const prevPage = document.getElementById("prev-page"); // Botón para ir a la página anterior
const firstPage = document.getElementById("first-page"); // Botón para ir a la primera página
const lastPage = document.getElementById("last-page"); // Botón para ir a la última página

// Variables para la autenticación con la API de Marvel
const urlApi = "https://gateway.marvel.com";
const parametrosAutenticacion = `?ts=${TIMESTAMP}&apikey=${API_KEY}&hash=${API_HASH}`;

// URLs de Personajes y Comics
const urlPersonajes = "/v1/public/characters";
const urlComics = "/v1/public/comics";

// Función para traer los datos de la API de Marvel
// Recibe el tipo (personajes o cómics), la consulta de búsqueda (query), el criterio de ordenación, y la página actual
const getData = async (tipo, query = "", orden = "", page = 1) => {
  // Construir la URL dependiendo si es personajes o cómics
  let url = urlApi + (tipo === "personajes" ? urlPersonajes : urlComics);
  
  // Parámetros para la búsqueda (autenticación, cantidad de resultados por página, y la página actual)
  let searchParams = `${parametrosAutenticacion}&limit=20&offset=${(page - 1) * 20}`;
  
  // Si hay una búsqueda activa, agregar el query a los parámetros
  if (query) {
    if (tipo === "personajes") {
      searchParams += `&nameStartsWith=${query}`;
    } else if (tipo === "comics") {
      searchParams += `&titleStartsWith=${query}`;
    }
  }

  // Si se ha seleccionado un criterio de orden, agregarlo a los parámetros
  if (orden) {
    searchParams += `&orderBy=${orden}`;
  }

  // Hacer la petición a la API
  const response = await fetch(url + searchParams);
  const json = await response.json();
  
  // Verificar si hay resultados, si no, se muestra un error
  if (!json.data || !json.data.total) {
    console.error("No se encontró la propiedad 'total' en la respuesta de la API.");
    return;
  }

  // Actualizar el total de páginas y los elementos del DOM que muestran el estado de la paginación
  total = Math.ceil(json.data.total / 20); // Calcular el total de páginas
  paginaActualSpan.innerHTML = page; // Mostrar la página actual
  totalPaginasSpan.innerHTML = total; // Mostrar el total de páginas
  resultadosSpan.innerHTML = json.data.total; // Mostrar el total de resultados

  // Mostrar los resultados en la página
  printData(json.data.results, tipo);
  updatePagination(); // Actualizar el estado de los botones de paginación
};

// Función para mostrar los resultados
const printData = (arr, tipo) => {
  let card = "";
  arr.forEach((item) => {
    // Crear una tarjeta por cada elemento (personaje o cómic)
    card += `
      <div class="card" data-id="${item.id}" data-tipo="${tipo}">
        <div class="card-image">
            <img src="${item.thumbnail.path}.${item.thumbnail.extension}" alt="${tipo === "personajes" ? item.name : item.title}">
        </div>
        <div class="card-content">
            <p>${tipo === "personajes" ? `Nombre: ${item.name}` : `Título: ${item.title}`}</p>
            ${tipo === "personajes" ? `<p>Descripción: ${item.description || "No disponible"}</p>` : ""}
        </div>
      </div>
    `;
  });
  root.innerHTML = card; // Insertar las tarjetas en el contenedor principal (root)

  // Agregar evento click a cada tarjeta para mostrar detalles
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id'); // Obtener ID del elemento seleccionado
      const tipo = card.getAttribute('data-tipo'); // Obtener tipo (personaje o cómic)
      if (tipo === "personajes") {
        getCharacterDetails(id); // Mostrar detalles del personaje
      } else {
        getComicDetails(id); // Mostrar detalles del cómic
      }
    });
  });
};

// Función para obtener y mostrar detalles de un cómic
const getComicDetails = async (comicId) => {
  const response = await fetch(`${urlApi}${urlComics}/${comicId}${parametrosAutenticacion}`);
  const json = await response.json();
  
  if (json.data && json.data.results.length) {
    const comic = json.data.results[0]; // Obtener el primer resultado
    // Mostrar los detalles del cómic
    root.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center">
        <h2 class="text-2xl font-bold mb-4">${comic.title}</h2>
        <img src="${comic.thumbnail.path}.${comic.thumbnail.extension}" alt="${comic.title}" class="w-1/2 mb-4">
        <p class="mb-2">Fecha de lanzamiento: ${comic.dates[0].date}</p>
        <p class="mb-2">Descripción: ${comic.description || "No disponible"}</p>
        <p class="mb-2">Guionistas: ${comic.creators.items.map(item => item.name).join(', ')}</p>
        <p class="mb-2">Personajes incluidos: ${comic.characters.items.map(item => item.name).join(', ')}</p>
        <button id="back-button" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4">Volver a la búsqueda</button>
      </div>
    `;

    // Agregar evento para volver a la búsqueda
    document.getElementById('back-button').addEventListener('click', () => {
      resetSearchView();
    });
  }
};

// Función para obtener y mostrar detalles de un personaje
const getCharacterDetails = async (characterId) => {
  const response = await fetch(`${urlApi}${urlPersonajes}/${characterId}${parametrosAutenticacion}`);
  const json = await response.json();
  
  if (json.data && json.data.results.length) {
    const character = json.data.results[0]; // Obtener el primer resultado
    // Mostrar los detalles del personaje
    root.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center">
        <h2 class="text-2xl font-bold mb-4">${character.name}</h2>
        <img src="${character.thumbnail.path}.${character.thumbnail.extension}" alt="${character.name}" class="w-1/2 mb-4">
        <p class="mb-2">Descripción: ${character.description || "No disponible"}</p>
        <p class="mb-2">Cómics: ${character.comics.items.map(item => item.name).join(', ')}</p>
        <button id="back-button" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4">Volver a la búsqueda</button>
      </div>
    `;

    // Agregar evento para volver a la búsqueda
    document.getElementById('back-button').addEventListener('click', () => {
      resetSearchView();
    });
  }
};

// Función para restablecer la vista de búsqueda
const resetSearchView = () => {
  pagina = 1; // Reiniciar a la primera página
  getData(tipoSelect.value, searchInput.value, getOrdenValue(ordenSelect.value, tipoSelect.value), pagina); // Volver a cargar la búsqueda
};

// Función para convertir el valor de orden al formato aceptado por la API
const getOrdenValue = (orden, tipo) => {
  if (tipo === "personajes") {
    if (orden === "az") return "name";
    if (orden === "za") return "-name";
    if (orden === "masnuevos") return "modified";
    if (orden === "masviejos") return "-modified";
  } else if (tipo === "comics") {
    if (orden === "az") return "title";
    if (orden === "za") return "-title";
    if (orden === "masnuevos") return "focDate";
    if (orden === "masviejos") return "-focDate";
    
  }
  return "";
};

// Función para actualizar los botones de paginación
const updatePagination = () => {
  // Desactivar el botón de "primera página" y "anterior" si estamos en la primera página
  firstPage.disabled = (pagina === 1);
  prevPage.disabled = (pagina === 1);
  
  // Desactivar el botón de "última página" y "siguiente" si estamos en la última página
  lastPage.disabled = (pagina === total);
  nextPage.disabled = (pagina === total);
};

// Evento para la búsqueda
document.querySelector("button").addEventListener("click", () => {
  const query = searchInput.value;
  const tipo = tipoSelect.value;

  // Aplicar el orden en base al tipo seleccionado
  let orden = getOrdenValue(ordenSelect.value, tipo);

  pagina = 1; // Reiniciar la paginación en la búsqueda
  getData(tipo, query, orden);
});

// Asignar eventos a los botones de paginación
nextPage.addEventListener("click", () => {
  if (pagina < total) {
    pagina++;
    getData(tipoSelect.value, searchInput.value, getOrdenValue(ordenSelect.value, tipoSelect.value), pagina);
  }
});

prevPage.addEventListener("click", () => {
  if (pagina > 1) {
    pagina--;
    getData(tipoSelect.value, searchInput.value, getOrdenValue(ordenSelect.value, tipoSelect.value), pagina);
  }
});

firstPage.addEventListener("click", () => {
  if (pagina !== 1) {
    pagina = 1;
    getData(tipoSelect.value, searchInput.value, getOrdenValue(ordenSelect.value, tipoSelect.value), pagina);
  }
});

lastPage.addEventListener("click", () => {
  if (pagina !== total) {
    pagina = total;
    getData(tipoSelect.value, searchInput.value, getOrdenValue(ordenSelect.value, tipoSelect.value), pagina);
  }
});

// Cargar la primera página por defecto
getData(tipoSelect.value);
