async function fetchProducts() {
  try {
    const response = await fetch(
      "https://shop.saferut.com/shop/products/list_product_saferut"
    );
    if (!response.ok) {
      throw new Error("Error en la respuesta de la red");
    }
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

const tariffData = {
  ranges: [
    { start: 0, end: 50000000 },
    { start: 50000001, end: 100000000 },
    { start: 100000001, end: 200000000 },
    { start: 200000001, end: 1000000000 },
    { start: 1000000001, end: 5000000000 },
    { start: 5000000001, end: 10000000000 },
    { start: 10000000001, end: 50000000000 },
    { start: 50000000001, end: 100000000000 },
    { start: 100000000001, end: 500000000000 },
    { start: 500000000001, end: 1000000000000 },
    { start: 1000000000001, end: 5000000000000 },
    { start: 5000000000001, end: 10000000000000 },
    { start: 10000000000001, end: 0 },
  ],
  tariffs: {},
};

function transformData(products) {
  products.forEach((product) => {
    const { type, max_invoice, id, price, name, path_img, descr } = product;

    if (!tariffData.tariffs[type]) {
      tariffData.tariffs[type] = {};
    }

    if (!tariffData.tariffs[type][max_invoice]) {
      tariffData.tariffs[type][max_invoice] = [];
    }

    tariffData.tariffs[type][max_invoice].push({
      id,
      price,
      name,
      path_img,
      descr,
    });
  });

  for (const type in tariffData.tariffs) {
    for (const max_invoice in tariffData.tariffs[type]) {
      while (tariffData.tariffs[type][max_invoice].length < 13) {
        tariffData.tariffs[type][max_invoice].push({
          id: null,
          price: 0,
          name: "",
          path_img: "",
          descr: "",
        });
      }

      tariffData.tariffs[type][max_invoice].sort((a, b) => {
        if (a.price === b.price) {
          return a.id - b.id;
        }
        return a.price - b.price;
      });
    }
  }

  return tariffData;
}

function populateSelect(selectElement, options) {
  const fragment = document.createDocumentFragment();
  options.forEach(({ value, text }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    fragment.appendChild(option);
  });
  selectElement.appendChild(fragment);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(value);
}

function handleCalculateClick(tariffData) {
  const numFacturaSelect = document.getElementById("NumFactura");
  const rangoSelect = document.getElementById("Rango");

  const rangeIndex = rangoSelect.selectedIndex;
  const tariffKey = numFacturaSelect.value;

  const annualElement = document.getElementById("annual");
  const monthlyElement = document.getElementById("monthly");

  const noneTariff = document.getElementById("none-tariff");
  const displayTariff = document.getElementById("display-tariff");
  const buttonCarrito = document.getElementById("add-data-0");

  const type = annualElement.classList.contains("active")
    ? "annual"
    : "monthly";
  if (rangeIndex !== "" && tariffKey !== "") {
    const tariffValues = tariffData.tariffs[type][tariffKey];
    const value = tariffValues[rangeIndex - 1];

    if (type === "monthly" && value.price == 0) {
      console.log(
        `No se encuentra disponible para mensual este tipo de rango de facturación.`
      );
      noneTariff.classList.replace("d-block", "d-none");
    } else {
      noneTariff.classList.replace("d-block", "d-none");
      displayTariff.classList.replace("d-none", "d-block");

      const code_plan = document.getElementById("code_plan");
      const descr_plan = document.getElementById("descr_plan");
      const price_plan = document.getElementById("price_plan");
      const add_cart = document.getElementById("add_cart");

      code_plan.textContent = value.name;
      descr_plan.textContent = value.descr;
      price_plan.textContent = formatCurrency(value.price);

      const data = {
        id: value.id,
        name: value.name,
        price: value.price + "",
        path_img: value.path_img,
      };

      buttonCarrito.setAttribute("data-product", JSON.stringify(data));
      add_cart.classList.replace("d-none", "d-flex");
    }
  } else {
    console.log(`Por favor, selecciona un rango y una tarifa.`);
  }
}

function setSelect(type) {
  const annual = document.getElementById("annual");
  const monthly = document.getElementById("monthly");

  if (type === "annual") {
    monthly.classList.remove("active");
    annual.classList.add("active");
  } else {
    annual.classList.remove("active");
    monthly.classList.add("active");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const products = await fetchProducts();
  const tariffData = transformData(products);

  document.getElementById("content-calcule").innerHTML = `
      <div class="card">
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs">
            <li class="nav-item">
              <a role="button" id="annual" class="nav-link active" aria-current="true" onclick="setSelect('annual')">Anual</a>
            </li>
            <li class="nav-item">
              <a role="button" id="monthly" class="nav-link" onclick="setSelect('monthly')">Mensual</a>
            </li>
          </ul>
        </div>
        <div class="card-body text-center">
          <div class="row row-cols-1 row-cols-md-3">
            <div class="col text-start mt-2">
              <label for="NumFactura" class="form-label">Número máximo de facturas</label>
              <select id="NumFactura" class="form-select" aria-label="NumFactura">
                <option selected>Selecciona una opción</option>
              </select>
            </div>
            <div class="col text-start mt-2">
              <label for="Rango" class="form-label">Rango de facturación</label>
              <select id="Rango" class="form-select" aria-label="Rango">
                <option selected>Selecciona una opción</option>
              </select>
            </div>
            <div class="col d-flex align-items-center justify-content-center mt-2">
              <button id="calculateBtn" type="button" class="btn btn-primary">Calcular tarifa</button>
            </div>
          </div>
          <div class="row row-cols-1 row-cols-md mt-4">
            <div class="col-8 mt-2 detail-tariff p-4">
              <div id="none-tariff" class="d-block">
                <p class="fw-light fs-6 text-muted">
                  Calcule su tarifa para proporcionarle los detalles del plan que prefiera.
                </p>
                <div class="d-flex align-items-center justify-content-center">
                  <dotlottie-player
                    src="https://lottie.host/f5562867-22ef-463a-9634-7aca26f54940/i2flNWwX0o.lottie"
                    background="transparent" speed="1" style="width: 220px; height: 220px;" loop autoplay>
                  </dotlottie-player>
                </div>
              </div>
              <div id="display-tariff" class="d-none">
                <div class="row">
                  <img class="w-25" src="/app/assets/img/shops/Shop_2.svg" alt="product-c">
                </div>
                <div class="row">
                  <div class="col text-start">
                    <p class="m-0">Código del plan:</p>
                    <p id="code_plan" class="mb-2 text-muted"></p>
                    <p class="m-0">Descripción:</p>
                    <p id="descr_plan" class="mb-2 text-muted"></p>
                  </div>
                  <div class="col text-start">
                    <p class="m-0">Precio:</p>
                    <p id="price_plan" class="mb-2 text-muted"></p>
                  </div>
                </div>
                <div id="add_cart" class="row d-none">
                  <div class="col mt-2">
                    <button type="button" class="btn btn-outline-primary" id="add-data-0">
                      <i class="fa-solid fa-cart-shopping"></i> Agregar al carrito
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

  const numFacturaOptions = Object.keys(tariffData.tariffs["annual"])
    .sort((a, b) => a - b)
    .map((key) => ({ value: key, text: parseInt(key).toLocaleString() }));

  numFacturaOptions.push({ value: "0", text: "Máximo" });

  populateSelect(document.getElementById("NumFactura"), numFacturaOptions);

  const rangoOptions = tariffData.ranges.map((range) => {
    const startFormatted = range.start.toLocaleString("es-CO");
    const endFormatted =
      range.end === 0 ? "∞" : range.end.toLocaleString("es-CO");
    return {
      value: `${range.start} - ${range.end}`,
      text: `${startFormatted} - ${endFormatted}`,
    };
  });

  populateSelect(document.getElementById("Rango"), rangoOptions);

  document
    .getElementById("calculateBtn")
    .addEventListener("click", () => handleCalculateClick(tariffData));
});
