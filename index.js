// Variables globales
const root = document.getElementById("root");
const paginaActualSpan = document.getElementById("pagina-actual");
const totalPaginasSpan = document.getElementById("total-paginas");
const resultadosSpan = document.getElementById("resultados");

let pagina = 1;
let total = 0;
const tipoSelect = document.getElementById("tipo");
const ordenSelect = document.getElementById("orden");
const searchInput = document.querySelector("input");

// Botones de paginación
const nextPage = document.getElementById("next-page");
const prevPage = document.getElementById("prev-page");
const firstPage = document.getElementById("first-page");
const lastPage = document.getElementById("last-page");

// Autenticación
const urlApi = "https://gateway.marvel.com";
const parametrosAutenticacion = `?ts=${TIMESTAMP}&apikey=${API_KEY}&hash=${API_HASH}`;

// URLs de Personajes y Comics
const urlPersonajes = "/v1/public/characters";
const urlComics = "/v1/public/comics";

// Función para traer los datos de la API
const getData = async (tipo, query = "", orden = "", page = 1) => {
  let url = urlApi + (tipo === "personajes" ? urlPersonajes : urlComics);
  
  // Parámetros de búsqueda y orden
  let searchParams = `${parametrosAutenticacion}&limit=20&offset=${(page - 1) * 20}`;
  
  if (query) {
    if (tipo === "personajes") {
      searchParams += `&nameStartsWith=${query}`;
    } else if (tipo === "comics") {
      searchParams += `&titleStartsWith=${query}`;
    }
  }

  if (orden) {
    searchParams += `&orderBy=${orden}`;
  }

  const response = await fetch(url + searchParams);
  const json = await response.json();
  
  if (!json.data || !json.data.total) {
    console.error("No se encontró la propiedad 'total' en la respuesta de la API.");
    return;
  }

  total = Math.ceil(json.data.total / 20); // Actualizar el total de páginas
  paginaActualSpan.innerHTML = page;
  totalPaginasSpan.innerHTML = total;
  resultadosSpan.innerHTML = json.data.total;

  printData(json.data.results, tipo);
  updatePagination(); // Actualizar los botones de paginación
};

// Función para mostrar los resultados
const printData = (arr, tipo) => {
  let card = "";
  arr.forEach((item) => {
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
  root.innerHTML = card;

  // Agregar evento de clic a las tarjetas
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const tipo = card.getAttribute('data-tipo');
      if (tipo === "personajes") {
        getCharacterDetails(id);
      } else {
        getComicDetails(id);
      }
    });
  });
};

// Función para mostrar detalles del cómic
const getComicDetails = async (comicId) => {
  const response = await fetch(`${urlApi}${urlComics}/${comicId}${parametrosAutenticacion}`);
  const json = await response.json();
  
  if (json.data && json.data.results.length) {
    const comic = json.data.results[0];
    root.innerHTML = `
      <div>
        <h2>${comic.title}</h2>
        <img src="${comic.thumbnail.path}.${comic.thumbnail.extension}" alt="${comic.title}">
        <p>Fecha de lanzamiento: ${comic.dates[0].date}</p>
        <p>Descripción: ${comic.description || "No disponible"}</p>
        <p>Guionistas: ${comic.creators.items.map(item => item.name).join(', ')}</p>
        <p>Personajes incluidos: ${comic.characters.items.map(item => item.name).join(', ')}</p>
        <button id="back-button">Volver a la búsqueda</button>
      </div>
    `;

    document.getElementById('back-button').addEventListener('click', () => {
      resetSearchView();
    });
  }
};

// Función para mostrar detalles del personaje
const getCharacterDetails = async (characterId) => {
  const response = await fetch(`${urlApi}${urlPersonajes}/${characterId}${parametrosAutenticacion}`);
  const json = await response.json();
  
  if (json.data && json.data.results.length) {
    const character = json.data.results[0];
    root.innerHTML = `
      <div>
        <h2>${character.name}</h2>
        <img src="${character.thumbnail.path}.${character.thumbnail.extension}" alt="${character.name}">
        <p>Descripción: ${character.description || "No disponible"}</p>
        <p>Cómics: ${character.comics.items.map(item => item.name).join(', ')}</p>
        <button id="back-button">Volver a la búsqueda</button>
      </div>
    `;

    document.getElementById('back-button').addEventListener('click', () => {
      resetSearchView();
    });
  }
};

// Función para restablecer la vista de búsqueda
const resetSearchView = () => {
  pagina = 1; // Reiniciar a la primera página
  getData(tipoSelect.value, searchInput.value, getOrdenValue(ordenSelect.value, tipoSelect.value), pagina);
};

// Convertir los valores de orden al formato de la API
const getOrdenValue = (orden, tipo) => {
  if (tipo === "personajes") {
    if (orden === "az") return "name";
    if (orden === "za") return "-name";
    if (orden === "masnuevos") return "modified";
    if (orden === "masviejos") return "-modified";
  } else if (tipo === "comics") {
    if (orden === "fechaDePublicacion") return "focDate";
    if (orden === "fechaDePublicacionInversa") return "-focDate";
    if (orden === "titulo") return "title";
    if (orden === "tituloInversa") return "-title";
    if (orden === "numeroDeEmision") return "issueNumber";
    if (orden === "numeroDeEmisionInversa") return "-issueNumber";
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
