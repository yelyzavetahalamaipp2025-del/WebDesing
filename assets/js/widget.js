
"use strict";

/*
  AGRONEXT
  ЛАБОРАТОРНА РОБОТА №11

  Інтерактивний калькулятор держкомпенсації.

  Реалізовано:
  - Vanilla JavaScript;
  - роботу з DOM;
  - події input, change, submit, click;
  - автоматичне оновлення результатів;
  - перевірку введених значень;
  - захист від NaN та Infinity;
  - обробку Edge Cases;
  - мобільне меню.
*/

document.addEventListener("DOMContentLoaded", function () {

  /* ============================================
     1. МОБІЛЬНЕ МЕНЮ
     ============================================ */

  const menuButton = document.getElementById("menuButton");
  const mobileMenu = document.getElementById("mobileNavigation");
  const menuIcon = document.getElementById("menuIcon");

  if (menuButton && mobileMenu && menuIcon) {

    function setMenu(open) {

      mobileMenu.hidden = !open;

      menuButton.setAttribute(
        "aria-expanded",
        String(open)
      );

      menuButton.setAttribute(
        "aria-label",
        open ? "Закрити меню" : "Відкрити меню"
      );

      menuIcon.innerHTML = open
        ? '<path d="M6 6l12 12M18 6L6 18"/>'
        : '<path d="M4 6h16M4 12h16M4 18h16"/>';

    }

    menuButton.addEventListener("click", function () {
      setMenu(mobileMenu.hidden);
    });

    document.addEventListener("click", function (event) {

      if (!event.target.closest(".site-header")) {
        setMenu(false);
      }

    });

    window.addEventListener("resize", function () {

      if (window.innerWidth >= 768) {
        setMenu(false);
      }

    });

    document.addEventListener("keydown", function (event) {

      if (event.key === "Escape") {
        setMenu(false);
      }

    });
  }

  /* ============================================
     2. ПЕРЕВІРКА ЕЛЕМЕНТІВ КАЛЬКУЛЯТОРА
     ============================================ */

  const form = document.getElementById("compensationForm");

  // Якщо калькулятора немає на цій сторінці,
  // завершуємо роботу без критичної помилки.
  if (!form) {
    return;
  }

  const modelSelect = document.getElementById("modelSelect");
  const priceInput = document.getElementById("priceInput");
  const quantityInput = document.getElementById("quantityInput");
  const vatSelect = document.getElementById("vatSelect");
  const rateSelect = document.getElementById("rateSelect");

  const formError = document.getElementById("formError");

  const compensationResult =
    document.getElementById("compensationResult");

  const totalResult =
    document.getElementById("totalResult");

  const baseResult =
    document.getElementById("baseResult");

  const rateResult =
    document.getElementById("rateResult");

  const ownResult =
    document.getElementById("ownResult");

  const resultNotice =
    document.getElementById("resultNotice");

  const requiredElements = [
    modelSelect,
    priceInput,
    quantityInput,
    vatSelect,
    rateSelect,
    formError,
    compensationResult,
    totalResult,
    baseResult,
    rateResult,
    ownResult,
    resultNotice
  ];

  // Захист від відсутніх DOM-елементів.
  if (requiredElements.some(element => element === null)) {
    return;
  }

  /* ============================================
     3. ДАНІ ТЕХНІКИ
     ============================================ */

  // Ціни з каталогу AgroNext.
  // Вони є прикладами для розрахунку.
  // Ознаку наявності ПДВ потрібно звіряти
  // з фактичним рахунком продавця.

  const machines = {
    "dtz-504u": 496480,
    "dtz-354u": 375840,
    "dtz-504kku": 626400,
    "dtz-504bkku": 784160,
    "dtz-1204": 1531200,
    "dtz-1204-spec": 1531200,
    "dtz-1304": 1610080,
    "dtz-470bn-gt": 20045
  };

  /* ============================================
     4. КОНСТАНТИ
     ============================================ */

  const MAX_UNIT_PRICE = 100000000;
  const MIN_UNIT_PRICE = 0.01;

  const MIN_QUANTITY = 1;
  const MAX_QUANTITY = 20;

  const VAT_RATE = 0.20;

  // Граничний річний розмір компенсації
  // для одного покупця у 2026 році.
  // Калькулятор не знає, скільки компенсації
  // покупець уже отримав за іншими заявками.
  const MAX_COMPENSATION_2026 = 86000000;

  const formatter = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  /* ============================================
     5. ДОПОМІЖНІ ФУНКЦІЇ
     ============================================ */

  function roundMoney(value) {

    // Округлення до двох знаків після коми.
    return Math.round(
      (value + Number.EPSILON) * 100
    ) / 100;

  }

  function formatMoney(value) {

    if (!Number.isFinite(value)) {
      return "—";
    }

    return formatter.format(roundMoney(value)) + " грн";

  }

  function normalizeNumber(value) {

    return String(value)
      .trim()
      .replace(/[\s\u00A0\u202F]/g, "")
      .replace(",", ".");

  }

  function parsePrice(rawValue) {

    const cleaned = normalizeNumber(rawValue);

    if (cleaned === "") {
      return null;
    }

    // Дозволяємо цифри та максимум
    // два десяткові знаки.
    //
    // Приклади правильних значень:
    // 120000
    // 120000.50
    // 120000,50
    //
    // Неправильні:
    // -5
    // abc
    // 1e20
    // 20.2.3

    if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) {
      return null;
    }

    const number = Number(cleaned);

    if (!Number.isFinite(number)) {
      return null;
    }

    if (number < MIN_UNIT_PRICE ||
        number > MAX_UNIT_PRICE) {
      return null;
    }

    return number;

  }

  function parseQuantity(rawValue) {

    const cleaned = String(rawValue).trim();

    if (!/^\d+$/.test(cleaned)) {
      return null;
    }

    const number = Number(cleaned);

    if (!Number.isSafeInteger(number)) {
      return null;
    }

    if (number < MIN_QUANTITY ||
        number > MAX_QUANTITY) {
      return null;
    }

    return number;

  }

  /* ============================================
     6. КЕРУВАННЯ ПОМИЛКАМИ
     ============================================ */

  function clearInvalidFields() {

    [priceInput, quantityInput].forEach(function (input) {

      input.classList.remove("input-invalid");
      input.removeAttribute("aria-invalid");

    });

  }

  function markInvalid(input) {

    if (!input) {
      return;
    }

    input.classList.add("input-invalid");
    input.setAttribute("aria-invalid", "true");

  }

  function clearResults() {

    compensationResult.textContent = "—";
    totalResult.textContent = "—";
    baseResult.textContent = "—";
    rateResult.textContent = "—";
    ownResult.textContent = "—";

  }

  function showError(message, input) {

    clearInvalidFields();

    if (input) {
      markInvalid(input);
    }

    formError.textContent = message;
    formError.hidden = false;

    clearResults();

    resultNotice.textContent =
      "Виправте введені значення, " +
      "щоб отримати коректний розрахунок.";

  }

  function clearError() {

    formError.textContent = "";
    formError.hidden = true;

    clearInvalidFields();

  }

  /* ============================================
     7. ОСНОВНИЙ АЛГОРИТМ
     ============================================ */

  function calculateCompensation() {

    clearError();

    // Перевірка ціни
    const price = parsePrice(priceInput.value);

    if (price === null) {

      showError(
        "Введіть правильну ціну від 0,01 до " +
        "100 000 000 грн. Можна використовувати " +
        "крапку або кому для копійок.",
        priceInput
      );

      return;
    }

    // Перевірка кількості
    const quantity = parseQuantity(quantityInput.value);

    if (quantity === null) {

      showError(
        "Кількість має бути цілим числом " +
        "від 1 до 20.",
        quantityInput
      );

      return;
    }

    // Перевірка ПДВ
    const vatMode = vatSelect.value;

    if (vatMode !== "included" &&
        vatMode !== "excluded") {

      showError("Оберіть спосіб зазначення ПДВ.");

      return;
    }

    // Перевірка ставки
    const rateValue = rateSelect.value;

    if (rateValue !== "25" &&
        rateValue !== "40") {

      showError("Оберіть ставку компенсації.");

      return;
    }

    const rate = Number(rateValue) / 100;

    // Загальна вартість покупки
    const totalPrice = price * quantity;

    if (!Number.isFinite(totalPrice) ||
        totalPrice <= 0) {

      showError(
        "Неможливо обчислити загальну вартість.",
        priceInput
      );

      return;
    }

    /*
      Визначаємо базу без ПДВ.

      Якщо ціна з ПДВ 20%:
        basePrice = totalPrice / 1.20

      Якщо ціна без ПДВ:
        basePrice = totalPrice
    */

    const basePrice = vatMode === "included"
      ? totalPrice / (1 + VAT_RATE)
      : totalPrice;

    /*
      Обчислення компенсації:

      compensation = basePrice * rate

      Ставка:
      0.25 або 0.40
    */

    const calculatedCompensation = basePrice * rate;

    // Застосування річного ліміту.
    const compensation = Math.min(
      calculatedCompensation,
      MAX_COMPENSATION_2026
    );

    /*
      Власні витрати покупця після
      можливої компенсації.
    */

    const ownExpenses = totalPrice - compensation;

    // Фінальна перевірка обчислень.
    const values = [
      totalPrice,
      basePrice,
      calculatedCompensation,
      compensation,
      ownExpenses
    ];

    if (values.some(value => !Number.isFinite(value)) ||
        ownExpenses < 0) {

      showError(
        "Виникла помилка розрахунку. " +
        "Перевірте введені дані."
      );

      return;
    }

    /* ========================================
       8. ВІДОБРАЖЕННЯ РЕЗУЛЬТАТУ
       ======================================== */

    compensationResult.textContent =
      formatMoney(compensation);

    totalResult.textContent =
      formatMoney(totalPrice);

    baseResult.textContent =
      formatMoney(basePrice);

    rateResult.textContent =
      rateValue + "%";

    ownResult.textContent =
      formatMoney(ownExpenses);

    /*
      Використовуємо textContent,
      а не вставлення HTML із введених значень.
    */

    if (rateValue === "40") {

      resultNotice.textContent =
        "Показано попередній розрахунок за ставкою 40%. " +
        "Її застосування залежить від підтвердження " +
        "спеціальних територіальних та інших умов. " +
        "Калькулятор не підтверджує право на виплату.";

    } else {

      resultNotice.textContent =
        "Показано попередній розрахунок за ставкою 25%. " +
        "Фактичне право на компенсацію залежить " +
        "від відповідності техніки й покупця " +
        "умовам державної програми.";

    }

    if (calculatedCompensation >
        MAX_COMPENSATION_2026) {

      resultNotice.textContent +=
        " Розрахована сума обмежена річним " +
        "лімітом 86 млн грн. Раніше отримані " +
        "покупцем компенсації не враховані.";

    }

  }

  /* ============================================
     9. ВИБІР МОДЕЛІ ТЕХНІКИ
     ============================================ */

  modelSelect.addEventListener("change", function () {

    const selected = modelSelect.value;

    if (selected === "manual") {

      priceInput.value = "";
      calculateCompensation();

      priceInput.focus();

      return;
    }

    if (Object.prototype.hasOwnProperty.call(
      machines,
      selected
    )) {

      priceInput.value = String(machines[selected]);

    }

    calculateCompensation();

  });

  /* ============================================
     10. ПОДІЇ INPUT ТА CHANGE
     ============================================ */

  priceInput.addEventListener(
    "input",
    calculateCompensation
  );

  quantityInput.addEventListener(
    "input",
    calculateCompensation
  );

  vatSelect.addEventListener(
    "change",
    calculateCompensation
  );

  rateSelect.addEventListener(
    "change",
    calculateCompensation
  );

  /* ============================================
     11. НАТИСКАННЯ КНОПКИ
     ============================================ */

  form.addEventListener("submit", function (event) {

    // Запобігаємо перезавантаженню сторінки.
    event.preventDefault();

    calculateCompensation();

  });

  /* ============================================
     12. ПОЧАТКОВИЙ РОЗРАХУНОК
     ============================================ */

  calculateCompensation();

});
