<div align="center">

# 🛒 Zaki Supermarket — Web Frontend

![Angular](https://img.shields.io/badge/Angular-21.1-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

</div>

---

## 📖 Project Overview

**Zaki Supermarket** is a retail management system forked from [SmartPharma](https://github.com/amer-rouby/smartpharma-frontend), reusing its Angular architecture, design system, and feature set (dashboard, POS, inventory, purchasing, payments, reporting, i18n) as a starting point for a **supermarket** business instead of a pharmacy.

## ⚠️ Fork status — read before assuming anything works as a supermarket

This repository is a **direct file copy** of the SmartPharma frontend, with only project identity changed so far (package name, app title, API port). It is **not yet adapted to supermarket business rules**:

- Screens, copy, and validation still reference pharmacy concepts — prescription upload, drug categories, controlled-substance badges, batch/expiry framing tuned for medicine.
- No supermarket-specific screens (e.g. weight-based pricing, loyalty points, different receipt formats) have been designed yet.

**Runs independently of SmartPharma** — different app name/title, different backend port (`8082` vs `8081`) — so both can run side by side during development.

## 🛠 Tech Stack

Same as SmartPharma — Angular 21 (standalone components), TypeScript 5.9, Angular Material, RxJS, Chart.js, ngx-translate. See the [SmartPharma frontend README](https://github.com/amer-rouby/smartpharma-frontend) for full architecture until this one gets its own pass.

## 🚀 Running locally

```bash
npm install
npm start
```
Navigate to `http://localhost:4200/`. Requires the [backend](https://github.com/amer-rouby/zaki-supermarket-backend) running on `http://localhost:8082`.

## 🔗 Related Repositories

- **Backend**: [zaki-supermarket-backend](https://github.com/amer-rouby/zaki-supermarket-backend)
- **Mobile**: [zaki-supermarket-mobile](https://github.com/amer-rouby/zaki-supermarket-mobile)
- **Forked from**: [smartpharma-frontend](https://github.com/amer-rouby/smartpharma-frontend)

## 📄 License

This project is proprietary and protected by intellectual property rights.
