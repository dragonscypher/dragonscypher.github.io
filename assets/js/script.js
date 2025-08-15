'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
    modalContainer.classList.toggle("active");
    overlay.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

    testimonialsItem[i].addEventListener("click", function () {

        modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
        modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
        modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
        modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

        testimonialsModalFunc();

    });

}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);



// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

if (select) {
    select.addEventListener("click", function () { elementToggleFunc(this); });
}

if (selectItems && selectItems.length && selectValue && select) {
    for (let i = 0; i < selectItems.length; i++) {
        selectItems[i].addEventListener("click", function () {
            let selectedValue = this.innerText.toLowerCase();
            selectValue.innerText = this.innerText;
            elementToggleFunc(select);
            filterFunc(selectedValue);
        });
    }
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");
const filterMap = {
    ai: ["ai", "machine-learning", "medical-ai", "healthcare-ai", "optimization", "game-data-management"],
    cloud: ["cloud-computing", "automation", "sustainability"],
    data: ["data-analysis", "visualization", "research", "finance"],
    dev: ["ar-vr", "web-dev", "dev"],
};

function filterFunc(selectedValue) {
    for (let i = 0; i < filterItems.length; i++) {
        if (selectedValue === "all") {
            filterItems[i].classList.add("active");
        } else {
            const cat = filterItems[i].dataset.category;
            if (filterMap[selectedValue] && filterMap[selectedValue].includes(cat)) {
                filterItems[i].classList.add("active");
            } else {
                filterItems[i].classList.remove("active");
            }
        }
    }
}

// add event in all filter button items for large screen
const projectFilter = document.getElementById("project-filter");
if (projectFilter) {
    projectFilter.addEventListener("change", function () {
        filterFunc(this.value);
    });
    // Show all by default
    filterFunc("all");
}



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
    formInputs[i].addEventListener("input", function () {

        // check form validation
        if (form.checkValidity()) {
            formBtn.removeAttribute("disabled");
        } else {
            formBtn.setAttribute("disabled", "");
        }

    });
}



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
if (navigationLinks && navigationLinks.length && pages && pages.length) {
    navigationLinks.forEach((navLink) => {
        navLink.addEventListener('click', function () {
            // Normalize nav link text
            const navText = this.textContent.trim().toLowerCase().replace(/-/g, "");
            // Remove 'active' from all nav links and pages
            navigationLinks.forEach(link => link.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));
            // Add 'active' to clicked nav link
            this.classList.add('active');
            // Add 'active' to matching page
            pages.forEach(page => {
                if (page.dataset.page) {
                    const pageName = page.dataset.page.trim().toLowerCase().replace(/-/g, "");
                    if (navText === pageName) {
                        page.classList.add('active');
                    }
                }
            });
        });
    });
}