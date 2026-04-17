# QuantixOne Playwright E2E Test Suite

## Overview

This project contains a complete end-to-end (E2E) automation testing suite for the QuantixOne website using Playwright and TypeScript.

The objective is to validate core functionalities, ensure UI stability, and test real-world user workflows across multiple browsers and devices.

---

## Test Coverage

### Core Functional Tests

* Homepage UI validation
* Navigation links verification
* Logo redirection check
* Footer validation

### Demo Booking (Critical Flow)

* Book a Demo button interaction
* Iframe handling for booking system
* Form validation (empty and invalid inputs)
* Valid input handling

### Chatbot Testing

* Chatbot visibility and interaction
* Asking meaningful questions
* Validating responses
* Follow-up conversation testing

### Responsive Testing

* Mobile (375x667)
* Tablet (768x1024)
* Desktop (1280x720, 1440x900)
* Horizontal scroll detection
* Layout validation across devices

### Performance Testing

* Page load performance validation
* Console error detection
* Runtime stability checks

---

## Total Tests

* 140+ automated test cases
* Cross-browser execution
* Real user scenario coverage

---

## Tech Stack

* Playwright
* TypeScript
* Node.js
* Page Object Model (POM)

---

## Installation

```bash
npm install
```

---

## Run Tests

```bash
npx playwright test
```

---

## View Reports

```bash
npx playwright show-report
```

---

## Cross Browser Support

Tests are executed on:

* Chromium
* Firefox
* WebKit

---

## Project Structure

```
tests/
  chatbot.spec.ts
  forms.spec.ts
  homepage.spec.ts
  navigation.spec.ts
  performance.spec.ts
  responsive.spec.ts

pages/
helpers/
utils/

BUG_REPORT.md
playwright.config.ts
```

---

## Bug Reports

All identified issues are documented in:

BUG_REPORT.md

Includes:

* Steps to reproduce
* Expected vs actual behavior
* Severity and status

---

## Key Highlights

* Handles iframe-based forms
* Covers chatbot interaction scenarios
* Includes performance and responsive testing
* Clean and scalable test structure
* Cross-browser validation

---

## Notes

* Test artifacts (videos, reports, node_modules) are excluded for clean repository management
* Designed for practical QA automation scenarios

---

## Author

Rajesh Mudavath
