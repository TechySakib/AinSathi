# 🏬 Chain of Stores — Sales Management System

<div align="center">

![PHP](https://img.shields.io/badge/Backend-PHP%207%2B-777BB4?style=for-the-badge&logo=php)
![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql)
![HTML5](https://img.shields.io/badge/Frontend-HTML5%20%2F%20CSS3-E34F26?style=for-the-badge&logo=html5)
![FontAwesome](https://img.shields.io/badge/Icons-FontAwesome-528DD7?style=for-the-badge&logo=fontawesome)
![Platform](https://img.shields.io/badge/Platform-Web%20Based-lightblue?style=for-the-badge)

**A role-based retail management platform for multi-branch store operations, built with PHP, MySQL, and a modern glassmorphism UI**

[Features](#-features) • [Architecture](#-system-architecture) • [Installation](#-installation--setup) • [Credentials](#-default-credentials) • [Security](#-security-considerations)

</div>

---

## 🎯 Overview

**Chain of Stores** is a full-featured, multi-role web application designed to centralize retail operations across multiple store branches. It supports three distinct user roles — **Manager**, **Salesman**, and **Customer** — each with a dedicated dashboard and scoped access, all accessible through a single unified login.

### 💡 Why This Project?

- ✅ **Role-Based Architecture** — Clean separation of concerns across three user types
- ✅ **Real-Time Sales Recording** — Salesmen log transactions instantly from their dashboard
- ✅ **Customer-Facing Portal** — Full shopping flow with cart, reviews, and purchase history
- ✅ **Analytics & Reporting** — Managers get aggregated sales insights across all branches
- ✅ **Modern UI Design** — Glassmorphism aesthetic with responsive layouts

---

## ✨ Features

### 🔐 Authentication
- Unified login for all user roles (Manager, Salesman, Customer)
- Session-based access control with role-aware redirection
- Customer self-registration via `/register.php`
- Secure logout with full session destruction

### 🧑‍💼 Manager Module
| Feature | Description |
|---|---|
| Dashboard | Overview of stores, staff, products, and recent sales |
| Employee Management | Add, view, and remove employee accounts |
| Store Management | Create and manage multiple branch locations |
| Product Management | Full CRUD for the product catalog |
| Employee Assignment | Map salesmen to specific store branches |
| Sales Reports | Aggregated analytics across all stores and employees |

### 👨‍💼 Salesman Module
| Feature | Description |
|---|---|
| Personal Dashboard | Summary of assigned store and recent activity |
| Assigned Store View | Details of the salesman's assigned branch |
| Record Sales | Log new transactions in real time |
| Sales History | Personal log of all recorded transactions |

### 👥 Customer Module
| Feature | Description |
|---|---|
| Registration | Self-service account creation |
| Product Browsing | Grid catalog with detailed popup modals |
| Reviews & Ratings | Star ratings and text reviews per product |
| Shopping Cart | Add, adjust, and remove items before checkout |
| Purchase History | Full log of past orders with dates and amounts |

---

## 🏗️ System Architecture

```
┌───────────────────────────────────────────────────┐
│                Browser (Client)                   │
│           HTML5 + CSS3 + FontAwesome              │
└────────────────────┬──────────────────────────────┘
                     │ HTTP Requests
┌────────────────────▼──────────────────────────────┐
│               Apache Web Server                   │
│                                                   │
│  ┌───────────┐  ┌─────────────┐  ┌────────────┐  │
│  │  Manager  │  │   Employee  │  │  Customer  │  │
│  │  Module   │  │   Module    │  │   Module   │  │
│  └─────┬─────┘  └──────┬──────┘  └─────┬──────┘  │
│        └───────────────┼────────────────┘         │
│                        │                          │
│             ┌──────────▼──────────┐               │
│             │   includes/db.php   │               │
│             │   (PDO / MySQLi)    │               │
│             └──────────┬──────────┘               │
└────────────────────────┼──────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────┐
│              MySQL Database                       │
│           (chain_of_store schema)                 │
└───────────────────────────────────────────────────┘
```

### Role Routing Flow
```
Login → Role Check → Redirect
           │
           ├── manager   → /manager/manager_dashboard.php
           ├── employee  → /employee/employee_dashboard.php
           └── customer  → /customer/customer_dashboard.php
```

---

## 🗂️ Project Structure

```
Chain-of-Stores-Sale-Management-System/
│
├── includes/
│   ├── db.php                    # PDO + MySQLi DB connection
│   └── footer.php                # Shared footer template
│
├── manager/
│   ├── manager_dashboard.php     # Admin overview
│   ├── add_employee.php          # Register new employees
│   ├── view_employees.php        # List & remove employees
│   ├── add_store.php             # Create store branches
│   ├── add_product.php           # Add products to catalog
│   ├── view_products.php         # Browse & manage products
│   ├── assign_employee_store.php # Assign staff to branches
│   └── sales_reports.php         # Chain-wide analytics
│
├── employee/
│   ├── employee_dashboard.php    # Personal overview
│   ├── view_assigned_store.php   # Assigned branch details
│   ├── record_sales.php          # Log new transactions
│   └── view_sales.php            # Personal sales history
│
├── customer/
│   ├── customer_dashboard.php    # Customer home
│   ├── browse_products.php       # Product catalog + popups
│   ├── review_product.php        # Submit ratings & reviews
│   ├── purchase_history.php      # Past order log
│   └── cart.php                  # Shopping cart
│
├── login.php                     # Unified login portal
├── register.php                  # Customer registration
├── logout.php                    # Session termination
├── chain_of_store.sql            # Full DB schema + seed data
└── README.md
```

---

## 🗃️ Database Schema

| Table | Description |
|---|---|
| `users` | All accounts — manager, employee, customer — with role field |
| `stores` | Branch records (name, location) |
| `employees` | Employee profiles linked to user accounts |
| `employee_store` | Junction table: employee ↔ branch assignment |
| `products` | Catalog (name, price, description, stock) |
| `sales` | Transactions logged by salesmen |
| `cart` | Active shopping cart items per customer |
| `orders` | Completed customer purchases |
| `reviews` | Product star ratings and text reviews |

> Full schema with constraints and seed data is in `chain_of_store.sql`.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3 (Vanilla) | Structure and styling |
| **Icons** | FontAwesome | UI iconography |
| **Backend** | PHP 7+ | Server-side logic |
| **DB Driver** | PDO + MySQLi (hybrid) | Database access |
| **Database** | MySQL 5.7+ / MariaDB | Data persistence |
| **Auth** | PHP Sessions | Role-based access |
| **UI Style** | Glassmorphism | Modern visual design |
| **Server** | Apache (XAMPP / WAMP) | Local hosting |

---

## 🚀 Installation & Setup

### Prerequisites

- [XAMPP](https://www.apachefriends.org/) or [WAMP](https://www.wampserver.com/)
- PHP 7.4+
- MySQL 5.7+ or MariaDB 10.3+
- A modern web browser

---

### Step 1 — Clone or Download

```bash
git clone https://github.com/your-username/Chain-of-Stores-Sale-Management-System.git
```
Or download and extract the ZIP.

---

### Step 2 — Move to Server Root

| Server | Web Root |
|---|---|
| XAMPP (Windows) | `C:/xampp/htdocs/` |
| WAMP (Windows) | `C:/wamp64/www/` |
| LAMP (Linux) | `/var/www/html/` |

Your final path should look like:
```
htdocs/Chain-of-Stores-Sale-Management-System/
```

---

### Step 3 — Database Setup

1. Start **Apache** and **MySQL** from your control panel.
2. Open `http://localhost/phpmyadmin`.
3. Create a new database named `chain_of_store`.
4. Select it → **Import** tab → upload `chain_of_store.sql` → click **Go**.

---

### Step 4 — Configure Credentials

Edit `includes/db.php` if your MySQL setup differs from defaults:

```php
$host = '127.0.0.1';
$db   = 'chain_of_store';
$user = 'root';
$pass = ''; // Add your password here if set
```

---

### Step 5 — Launch

Open your browser and navigate to:

```
http://localhost/Chain-of-Stores-Sale-Management-System/
```

---

## 🔐 Default Credentials

| Role | Email | Password |
|---|---|---|
| **Manager** | `manager@store.com` | `password` |
| **Salesman** | `salesman@store.com` | `password` |
| **Customer** | Register via `/register.php` | *(self-set)* |

> ⚠️ Change these before deploying to any public or production environment.

---

## 🔒 Security Considerations

| Practice | Status |
|---|---|
| PDO Prepared Statements (SQL injection prevention) | ✅ Implemented |
| Session-based authentication | ✅ Implemented |
| Role-based page access checks | ✅ Implemented |
| Password hashing (`password_hash` / bcrypt) | ⚠️ Verify in `register.php` |
| CSRF protection on forms | 🔲 Recommended to add |
| Input sanitization & validation | ⚠️ Review all form inputs |
| HTTPS enforcement | 🔲 Required for production |

---

## 🔮 Limitations & Future Improvements

- No email verification on registration — can be added with PHPMailer
- No product image uploads — file upload with validation can be introduced
- PDO/MySQLi hybrid — refactoring to PDO-only would improve consistency
- No pagination on large list views — recommended for scalability
- No REST API layer — would enable mobile app integration in the future

---

## 👥 Team

| Name | Role |
|---|---|
| **[Your Name]** | Full-Stack Developer |

---

<div align="center">

**Built with ❤️ using PHP, MySQL, HTML & CSS**

*Version: 1.0.0 — Status: Development*

**[⬆ Back to Top](#-chain-of-stores--sales-management-system)**

</div>
