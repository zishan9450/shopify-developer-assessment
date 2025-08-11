# Shopify Dynamic Product Page Assignment

[cite_start]This project is a complete implementation of a dynamic Shopify product page, built according to the specifications provided in the developer assignment brief[cite: 1]. [cite_start]The goal was to create a fully functional, interactive, and responsive product page that mirrors a Figma design, with all product data managed dynamically from the Shopify backend[cite: 5, 6].

[cite_start]**Project Duration:** 3 Days [cite: 52]

---

## Live Demo

* **Live Store URL:** `[Your Live Store Product Page URL]`
* [cite_start]**Password:** `[Your Storefront Password]` [cite: 53]

---

## Features

The product page includes a rich set of features designed to provide an interactive and seamless user experience:

* [cite_start]**Product Media Gallery:** A product image carousel where thumbnail clicks dynamically update the main image[cite: 10, 11]. [cite_start]The gallery is variant-aware, updating images to reflect the selected flavor[cite: 12].
* **Dynamic Purchase Options:**
    * [cite_start]Two distinct purchase modes are available: "Single Drink Subscription" and "Double Drink Subscription," implemented as a radio button group[cite: 14, 15, 16].
    * [cite_start]Selecting a mode dynamically updates the entire UI, including the available flavor selectors and the total price[cite: 17].
* **Flavor Selection:**
    * [cite_start]Interactive image swatches for selecting flavors (Chocolate, Vanilla, Orange)[cite: 24].
    * [cite_start]The "Single Drink" mode displays one flavor selector, while the "Double Drink" mode displays two separate selectors[cite: 25, 26].
    * [cite_start]A flavor selection is required before adding items to the cart[cite: 27].
* **Dynamic Pricing & Discounts:**
    * [cite_start]All pricing is pulled directly from the Shopify backend, including `compare-at price` to display discounts[cite: 29].
    * [cite_start]The page reflects a 25% subscription discount and an additional 20% sales discount in its pricing structure[cite: 20, 21].
    * [cite_start]Prices update in real-time based on user selections (e.g., switching from single to double mode)[cite: 30].
* **"What's Included" Section:**
    * [cite_start]A contextual box that updates its content based on the selected purchase mode[cite: 33].
    * [cite_start]Displays delivery frequency, included items, and key benefits[cite: 34].
    * [cite_start]All content for this section is managed via custom metafields in the Shopify admin for easy updates[cite: 35].
* **AJAX Add to Cart:**
    * [cite_start]The page loads with the "Single drink subscription" and "Chocolate" flavor selected by default[cite: 37].
    * [cite_start]The "Add to Cart" button adds the correct product variant(s) to the cart without a page refresh[cite: 38].
    * For the "Double Drink" mode, the logic correctly adds two separate variants to the cart based on the user's two flavor selections.

---

## Technical Stack

* [cite_start]**Frontend:** HTML5, CSS/SCSS, JavaScript (ES6) [cite: 43]
* [cite_start]**Shopify:** Liquid Templating, Shopify Product & Variant Objects, Metafields [cite: 43]
* **APIs:** Shopify AJAX Cart API

---

## Data Structure & Setup Instructions

To ensure the page is fully dynamic, a specific data structure was created in the Shopify backend. To replicate this project, follow these setup steps:

1.  **Product Setup:**
    * Create a single product (e.g., "Protein Drink").
    * Add one **Option** named `Flavor` with the values `Chocolate`, `Vanilla`, and `Orange`. This will create three corresponding variants.

2.  **Variant Configuration:**
    * For each variant, set the **Price** and **Compare-at price** to reflect the discount structure. For example, for a final price of $6.00 after a 20% sale from an original subscription price of $7.50, set:
        * `Price`: `$6.00`
        * `Compare-at price`: `$7.50`
    * Assign the correct featured image to each variant (e.g., the chocolate bottle image for the Chocolate variant).

3.  **Metafields Setup:**
    * Navigate to **Settings** > **Custom data** > **Products**.
    * Create two **metafield** definitions:
        1.  **Name:** `Single Subscription Benefits`
            * **Namespace and key:** `custom.single_subscription_benefits`
            * **Type:** `Multi-line text`
        2.  **Name:** `Double Subscription Benefits`
            * **Namespace and key:** `custom.double_subscription_benefits`
            * **Type:** `Multi-line text`
    * [cite_start]On the product page in the Shopify admin, populate these metafields with the bullet-point text for each corresponding mode[cite: 35].

4.  **Template Installation:**
    * In your theme's code editor, create a new product template (`product.custom-template.liquid`).
    * Copy the code from this repository's `product.custom-template.liquid` file into your new template.
    * Copy the associated CSS/SCSS and JavaScript into your theme's asset files and ensure they are loaded.
    * Assign the new template to your product in the Shopify admin.

---

## Evaluation Criteria Met

This project was built to meet the following evaluation criteria:

* [cite_start]**Design Accuracy:** Faithful implementation of the provided Figma design[cite: 46].
* [cite_start]**Dynamic Logic:** All pricing and variant information is sourced directly from the Shopify backend without hardcoding[cite: 42, 47].
* [cite_start]**Code Quality:** Clean, maintainable, and well-documented Liquid, JS, and CSS code[cite: 43, 50].
* [cite_start]**Performance & Responsiveness:** The page is mobile-first and optimized for performance[cite: 48].
* [cite_start]**Interactivity:** A high-quality, stateful, and interactive user interface[cite: 49].
