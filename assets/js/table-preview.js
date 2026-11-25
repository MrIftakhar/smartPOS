/**
 * @fileoverview Search, sorting, and pagination for the smartPOS product table preview.
 * @author Md Iftakhar Islam
 */

const table = document.querySelector("#product-table");
const tableBody = table.tBodies[0];
const searchInput = document.querySelector("#product-table-search");
const status = document.querySelector("#product-table-status");
const previousButton = document.querySelector("#product-table-previous");
const nextButton = document.querySelector("#product-table-next");
const sortButtons = table.querySelectorAll("[data-sort-column]");

const productRows = Array.from(tableBody.rows);
const collator = new Intl.Collator(document.documentElement.lang, {
  sensitivity: "base"
});
const pageSize = 2;

let currentPage = 1;
let activeSortButton = null;
let sortDirection = 1;

const emptyRow = document.createElement("tr");
const emptyCell = emptyRow.insertCell();
emptyCell.colSpan = table.tHead.rows[0].cells.length;
emptyCell.className = "text-center py-4";

const emptyMessage = document.createElement("p");
emptyMessage.className = "smartpos-table-empty mb-0";
emptyMessage.textContent = "No products match your search.";
emptyCell.append(emptyMessage);

function compareRows(firstRow, secondRow) {
  const columnIndex = Number(activeSortButton.dataset.sortColumn);
  const firstCell = firstRow.cells[columnIndex];
  const secondCell = secondRow.cells[columnIndex];

  if (activeSortButton.hasAttribute("data-sort-numeric")) {
    const firstValue = Number(
      firstCell.dataset.sortValue ?? firstCell.textContent.trim()
    );
    const secondValue = Number(
      secondCell.dataset.sortValue ?? secondCell.textContent.trim()
    );

    return (firstValue - secondValue) * sortDirection;
  }

  return collator.compare(
    firstCell.textContent.trim(),
    secondCell.textContent.trim()
  ) * sortDirection;
}

function renderTable() {
  const query = searchInput.value.trim().toLocaleLowerCase();

  const matchingRows = productRows.filter((row) => {
    return Array.from(row.cells).some((cell) => {
      return cell.textContent.toLocaleLowerCase().includes(query);
    });
  });

  if (activeSortButton) {
    matchingRows.sort(compareRows);
  }

  const totalRows = matchingRows.length;
  const lastPage = Math.max(1, Math.ceil(totalRows / pageSize));
  currentPage = Math.min(currentPage, lastPage);

  const start = (currentPage - 1) * pageSize;
  const visibleRows = matchingRows.slice(start, start + pageSize);

  tableBody.replaceChildren(...(visibleRows.length ? visibleRows : [emptyRow]));

  status.textContent = totalRows
    ? `Showing ${start + 1}–${start + visibleRows.length} of ${totalRows} products`
    : "Showing 0 products";

  previousButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === lastPage;
}

searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderTable();
});

previousButton.addEventListener("click", () => {
  currentPage -= 1;
  renderTable();

  if (previousButton.disabled && !nextButton.disabled) {
    nextButton.focus();
  }
});

nextButton.addEventListener("click", () => {
  currentPage += 1;
  renderTable();

  if (nextButton.disabled && !previousButton.disabled) {
    previousButton.focus();
  }
});

for (const button of sortButtons) {
  button.disabled = false;

  button.addEventListener("click", () => {
    sortDirection = activeSortButton === button ? -sortDirection : 1;
    activeSortButton = button;
    currentPage = 1;

    for (const sortButton of sortButtons) {
      const heading = sortButton.closest("th");
      const indicator = sortButton.querySelector("span");

      if (sortButton === activeSortButton) {
        heading.setAttribute(
          "aria-sort",
          sortDirection === 1 ? "ascending" : "descending"
        );
        indicator.textContent = sortDirection === 1 ? "↑" : "↓";
      } else {
        heading.removeAttribute("aria-sort");
        indicator.textContent = "↕";
      }
    }

    renderTable();
  });
}

searchInput.disabled = false;
renderTable();