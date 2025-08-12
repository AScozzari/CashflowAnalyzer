import Header from "@/components/layout/header";
import FooterSignature from "@/components/layout/footer-signature";
import EntityConfig from "@/components/settings/entity-config";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <Header 
        title="Impostazioni" 
        subtitle="Configurazione entità del sistema"
      />
      
      <div className="p-4 md:p-6">
        <EntityConfig />
      </div>
      
      <FooterSignature />
    </div>
  );
}
