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
    searchParams += `&nameStartsWith=${query}`;
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
    <div class="card">
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
    if (orden === "fechaDeVenta") return "onsaleDate";
    if (orden === "fechaDeVentaInversa") return "-onsaleDate";
    if (orden === "titulo") return "title";
    if (orden === "tituloInversa") return "-title";
    if (orden === "numeroDeEmision") return "issueNumber";
    if (orden === "numeroDeEmisionInversa") return "-issueNumber";
  }
  return "";
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

// Cargar la primera página por defecto
getData("personajes");