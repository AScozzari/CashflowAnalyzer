import { storage } from "./storage";
import { hashPassword } from "./auth";

async function createAdminUser() {
  try {
    // Controlla se esiste già un admin
    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Crea password hash per "admin123"
    const hashedPassword = await hashPassword("admin123");
    
    // Crea utente admin
    const adminUser = await storage.createUser({
      username: "admin",
      password: hashedPassword,
      email: "admin@cashflow.it",
      role: "admin",
      resourceId: null,
      isFirstAccess: false, // Admin già configurato
    });

    console.log("Admin user created successfully:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Email: admin@cashflow.it");
    console.log("Role: admin");
    
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

createAdminUser();