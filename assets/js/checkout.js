/**
 * @fileoverview Product search, cart, cash payment, and receipt preview for smartPOS.
 * @author Md Iftakhar Islam
 */

const products = [
  { sku: "RICE-001", name: "Miniket rice", unitPrice: 8500, stock: 42 },
  { sku: "OIL-001", name: "Soybean oil", unitPrice: 18500, stock: 4 },
  { sku: "DRINK-001", name: "Orange juice", unitPrice: 6500, stock: 0 }
];

const cart = new Map();
const addButtons = new Map();

const searchInput = document.querySelector("#checkout-search");
const productList = document.querySelector("#checkout-products");
const cartBody = document.querySelector("#checkout-cart");
const cartTotal = document.querySelector("#checkout-total");
const status = document.querySelector("#checkout-status");

const paymentForm = document.querySelector("#checkout-payment-form");
const cashInput = document.querySelector("#checkout-cash");
const changeOutput = document.querySelector("#checkout-change");
const paymentHint = document.querySelector("#checkout-payment-hint");
const completeButton = document.querySelector("#checkout-complete");

const receipt = document.querySelector("#checkout-receipt");
const receiptDate = document.querySelector("#checkout-receipt-date");
const receiptItems = document.querySelector("#checkout-receipt-items");
const receiptTotal = document.querySelector("#checkout-receipt-total");
const receiptCash = document.querySelector("#checkout-receipt-cash");
const receiptChange = document.querySelector("#checkout-receipt-change");

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT"
});

const receiptDateFormatter = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Dhaka"
});

let currentTotal = 0;

function formatPrice(poisha) {
  return currency.format(poisha / 100);
}

function cashInPoisha() {
  if (!cashInput.validity.valid || !Number.isFinite(cashInput.valueAsNumber)) {
    return null;
  }

  return Math.round(cashInput.valueAsNumber * 100);
}

function syncPayment() {
  const cartEmpty = cart.size === 0;
  cashInput.disabled = cartEmpty;

  const cash = cartEmpty ? null : cashInPoisha();
  const canComplete = cash !== null && cash >= currentTotal;

  completeButton.disabled = !canComplete;
  changeOutput.textContent = canComplete ? formatPrice(cash - currentTotal) : "—";

  if (cartEmpty) {
    paymentHint.textContent = "Add an item to start a cash payment.";
  } else if (cashInput.validity.rangeOverflow) {
    paymentHint.textContent = `Enter a cash amount up to ${formatPrice(100000000)}.`;
  } else if (cash === null) {
    paymentHint.textContent = "Enter a non-negative cash amount with up to two decimal places.";
  } else if (cash < currentTotal) {
    paymentHint.textContent = `${formatPrice(currentTotal - cash)} more is needed.`;
  } else {
    paymentHint.textContent = "";
  }
}

function updateCartTotal() {
  currentTotal = products.reduce((total, product) => {
    return total + product.unitPrice * (cart.get(product.sku) ?? 0);
  }, 0);

  cartTotal.textContent = formatPrice(currentTotal);
  syncPayment();
}

function updateAddButtons() {
  for (const product of products) {
    const button = addButtons.get(product.sku);

    if (button) {
      button.disabled = (cart.get(product.sku) ?? 0) >= product.stock;
    }
  }
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const matches = products.filter((product) => (
    `${product.name} ${product.sku}`.toLowerCase().includes(query)
  ));

  productList.replaceChildren();
  addButtons.clear();

  if (matches.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "smartpos-text-secondary";
    emptyItem.textContent = "No matching products.";
    productList.append(emptyItem);
    return;
  }

  for (const product of matches) {
    const item = document.createElement("li");
    item.className = "d-flex align-items-center justify-content-between gap-3 py-2 border-bottom";

    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = product.name;

    const description = document.createElement("div");
    description.className = "small smartpos-text-secondary";
    description.textContent =
      `${product.sku} · ${formatPrice(product.unitPrice)} · ${product.stock} in stock`;

    details.append(name, description);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "btn btn-primary btn-sm";
    addButton.textContent = "Add";
    addButton.setAttribute("aria-label", `Add ${product.name} to cart`);

    addButton.addEventListener("click", () => {
      const quantity = cart.get(product.sku) ?? 0;

      if (quantity >= product.stock) {
        return;
      }

      cart.set(product.sku, quantity + 1);
      renderCart();
      status.textContent = `${product.name} added to the cart.`;

      if (addButton.disabled) {
        searchInput.focus();
      }
    });

    addButtons.set(product.sku, addButton);
    item.append(details, addButton);
    productList.append(item);
  }

  updateAddButtons();
}

function renderCart() {
  cartBody.replaceChildren();

  if (cart.size === 0) {
    const emptyCell = cartBody.insertRow().insertCell();
    emptyCell.colSpan = 5;
    emptyCell.className = "smartpos-table-empty text-center py-4";
    emptyCell.textContent = "The cart is empty.";
  }

  for (const product of products) {
    const quantity = cart.get(product.sku);

    if (!quantity) {
      continue;
    }

    const row = cartBody.insertRow();
    const name = document.createElement("th");
    name.scope = "row";
    name.textContent = product.name;
    row.append(name);

    const unitPriceCell = row.insertCell();
    unitPriceCell.className = "text-end text-nowrap smartpos-text-numeric";
    unitPriceCell.textContent = formatPrice(product.unitPrice);

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.className = "form-control form-control-sm";
    quantityInput.min = "1";
    quantityInput.max = String(product.stock);
    quantityInput.step = "1";
    quantityInput.required = true;
    quantityInput.value = String(quantity);
    quantityInput.setAttribute("aria-label", `Quantity for ${product.name}`);
    row.insertCell().append(quantityInput);

    const lineTotalCell = row.insertCell();
    lineTotalCell.className = "text-end text-nowrap smartpos-text-numeric";
    lineTotalCell.textContent = formatPrice(product.unitPrice * quantity);

    quantityInput.addEventListener("change", () => {
      if (!quantityInput.validity.valid) {
        quantityInput.value = String(cart.get(product.sku));
        status.textContent =
          `Enter a whole number from 1 to ${product.stock} for ${product.name}.`;
        return;
      }

      const updatedQuantity = quantityInput.valueAsNumber;

      cart.set(product.sku, updatedQuantity);
      lineTotalCell.textContent = formatPrice(product.unitPrice * updatedQuantity);
      updateCartTotal();
      updateAddButtons();
      status.textContent = `Quantity updated for ${product.name}.`;
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn-secondary btn-sm";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${product.name} from cart`);
    row.insertCell().append(removeButton);

    removeButton.addEventListener("click", () => {
      cart.delete(product.sku);
      renderCart();
      status.textContent = `${product.name} removed from the cart.`;
      searchInput.focus();
    });
  }

  updateCartTotal();
  updateAddButtons();
}

function showReceipt(cash) {
  receiptItems.replaceChildren();

  for (const product of products) {
    const quantity = cart.get(product.sku);

    if (!quantity) {
      continue;
    }

    const item = document.createElement("li");
    item.className = "mb-2";
    item.textContent =
      `${product.name} × ${quantity} — ${formatPrice(product.unitPrice * quantity)}`;
    receiptItems.append(item);
  }

  receiptDate.textContent = receiptDateFormatter.format(new Date());
  receiptTotal.textContent = formatPrice(currentTotal);
  receiptCash.textContent = formatPrice(cash);
  receiptChange.textContent = formatPrice(cash - currentTotal);

  receipt.showModal();
}

searchInput.addEventListener("input", renderProducts);
cashInput.addEventListener("input", syncPayment);

paymentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const cash = cashInPoisha();

  if (cart.size === 0 || cash === null || cash < currentTotal) {
    syncPayment();
    return;
  }

  showReceipt(cash);
  cart.clear();
  paymentForm.reset();
  renderCart();

  status.textContent = "Receipt preview created. The cart is ready for the next sale.";
});

receipt.addEventListener("close", () => {
  searchInput.focus();
});

renderProducts();
renderCart();