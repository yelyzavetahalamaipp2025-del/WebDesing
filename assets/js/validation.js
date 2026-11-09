document.addEventListener('DOMContentLoaded', () => {
    // Шукаємо форму на сторінці index.html або about.html
const forms = document.querySelectorAll('#feedbackForm, .lead-form-stacked, #aboutFeedbackForm');
if (!forms.length) return;
    
    if (!forms.length) return;

    forms.forEach(form => {
        const nameInput = form.querySelector('#username') || form.querySelector('input[name="name"]') || form.querySelector('input[type="text"]');
        const emailInput = form.querySelector('#email') || form.querySelector('input[name="email"]') || form.querySelector('input[type="email"]');
        const phoneInput = form.querySelector('#phone') || form.querySelector('input[name="phone"]') || form.querySelector('input[type="tel"]');
        const messageInput = form.querySelector('#message') || form.querySelector('textarea');
        const agreementInput = form.querySelector('#agreement') || form.querySelector('input[type="checkbox"]');
        const modal = document.getElementById('successModal');

        // Регулярні вирази
        const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const REGEX_PHONE = /^\+380\d{9}$/; // Строго +380 та 9 цифр

        function setError(input, errorId, message) {
            if (!input) return;
            input.classList.remove('border-slate-200', 'border-emerald-500');
            input.classList.add('border-red-500');
            
            // Шукаємо блок помилки у батьківському контейнері
            const errorEl = form.querySelector('#' + errorId) || input.parentElement.querySelector('.text-red-500');
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.classList.remove('hidden');
            }
            input.setAttribute('aria-invalid', 'true');
        }

        function setSuccess(input, errorId) {
            if (!input) return;
            input.classList.remove('border-slate-200', 'border-red-500');
            input.classList.add('border-emerald-500');
            
            const errorEl = form.querySelector('#' + errorId) || input.parentElement.querySelector('.text-red-500');
            if (errorEl) {
                errorEl.classList.add('hidden');
            }
            input.setAttribute('aria-invalid', 'false');
        }

        function validateName() {
            if (!nameInput) return true;
            if (nameInput.value.trim().length < 2) {
                setError(nameInput, 'nameError', "Ім'я має містити щонайменше 2 символи");
                return false;
            }
            setSuccess(nameInput, 'nameError');
            return true;
        }

        function validateEmail() {
            if (!emailInput) return true;
            if (!REGEX_EMAIL.test(emailInput.value.trim())) {
                setError(emailInput, 'emailError', "Введіть коректний email (наприклад: user@gmail.com)");
                return false;
            }
            setSuccess(emailInput, 'emailError');
            return true;
        }

        function validatePhone() {
            if (!phoneInput) return true;
            const val = phoneInput.value.trim();
            if (!REGEX_PHONE.test(val)) {
                setError(phoneInput, 'phoneError', "Формат телефону: +380XXXXXXXXX (13 символів)");
                return false;
            }
            setSuccess(phoneInput, 'phoneError');
            return true;
        }

        function validateMessage() {
            if (!messageInput) return true;
            if (messageInput.value.trim().length < 10) {
                setError(messageInput, 'messageError', "Повідомлення має містити не менше 10 символів");
                return false;
            }
            setSuccess(messageInput, 'messageError');
            return true;
        }

        function validateAgreement() {
            if (!agreementInput) return true;
            const errEl = form.querySelector('#agreementError') || agreementInput.parentElement.parentElement.querySelector('.text-red-500');
            if (!agreementInput.checked) {
                if (errEl) {
                    errEl.textContent = "Необхідно підтвердити згоду";
                    errEl.classList.remove('hidden');
                }
                return false;
            }
            if (errEl) errEl.classList.add('hidden');
            return true;
        }

        // Динамічна перевірка на blur та input
        if (nameInput) {
            nameInput.addEventListener('blur', validateName);
            nameInput.addEventListener('input', () => { if (nameInput.classList.contains('border-red-500')) validateName(); });
        }
        if (emailInput) {
            emailInput.addEventListener('blur', validateEmail);
            emailInput.addEventListener('input', () => { if (emailInput.classList.contains('border-red-500')) validateEmail(); });
        }
        if (phoneInput) {
            phoneInput.addEventListener('blur', validatePhone);
            phoneInput.addEventListener('input', () => { if (phoneInput.classList.contains('border-red-500')) validatePhone(); });
        }
        if (messageInput) {
            messageInput.addEventListener('blur', validateMessage);
            messageInput.addEventListener('input', () => { if (messageInput.classList.contains('border-red-500')) validateMessage(); });
        }
        if (agreementInput) {
            agreementInput.addEventListener('change', validateAgreement);
        }

        // ПОВНЕ БЛОКУВАННЯ ВІДПРАВКИ ТА ПЕРЕЗАНАВАНТАЖЕННЯ
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Зупиняє перехід на іншу сторінку!

            const v1 = validateName();
            const v2 = validateEmail();
            const v3 = validatePhone();
            const v4 = validateMessage();
            const v5 = validateAgreement();

            // Якщо ВСІ поля валідні — показуємо модальне вікно
            if (v1 && v2 && v3 && v4 && v5) {
                if (modal) {
                    modal.classList.remove('hidden');
                } else {
                    alert("Форму успішно надіслано! (Модальне вікно не знайдено в HTML)");
                }
                form.reset();
                [nameInput, emailInput, phoneInput, messageInput].forEach(i => {
                    if (i) i.classList.remove('border-emerald-500', 'border-red-500');
                });
            }
        });
    });

    // Логіка закриття модального вікна
    const modal = document.getElementById('successModal') || document.getElementById('aboutSuccessModal');
   const closeModalBtn = document.getElementById('closeModalBtn') || document.getElementById('closeAboutModalBtn');
    if (modal) {
        const closeModal = () => modal.classList.add('hidden');
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }
});