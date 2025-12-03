# AWS EC2 + NGINX Static Website Deployment

This project demonstrates hosting a static multi-page website on an **AWS EC2 Ubuntu server** using the **NGINX** web server.  
It includes HTML, CSS, JavaScript, and organized asset folders.

---

## Project Overview
- Launched an **EC2 instance** on AWS  
- Installed **NGINX** on Ubuntu  
- Deployed a static website by uploading HTML/CSS/JS files  
- Configured **Security Groups** to allow HTTP (80)  
- Managed server using Linux commands  
- Hosted multi-page site with assets and folder structure

---

## Technologies Used
- AWS EC2 (Ubuntu)  
- NGINX Web Server  
- Linux / SSH  
- HTML / CSS / JavaScript  
- Git & GitHub  

---

## Project Structure
├── index.html
├── catalog.html
├── contact.html
├── deals.html
├── app.js
├── styles1.css
├── assets/
└── company/

---

##  Steps to Deploy

### **1. Launch EC2 Instance**
- AMI: Ubuntu 22.04  
- Type: t2.micro  
- Security Group:
  - Allow **22 (SSH)**
  - Allow **80 (HTTP)**  

### **2. SSH into the EC2 Server**
```bash
ssh -i your-key.pem ubuntu@EC2_PUBLIC_IP
```

### **3. Install NGINX**
```bash
sudo apt update
sudo apt install nginx -y
```

### **4. Deploy the Website**
Uploaded  project files to NGINX’s default directory:
```bash
sudo rm -rf /var/www/html/*
sudo cp -r * /var/www/html/
```

### **5.Restart NGINX
```bash
sudo systemctl restart nginx
```

### **6.View Website
Open browser:
http://13.61.173.1

