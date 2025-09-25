import { ExcelProcessorComponent } from '@/components/ExcelProcessorComponent';

export function ExcelProcessorPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="mb-8 text-center lg:text-start">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Procesador de Excel
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
            Procesa tus archivos de Excel con reglas comerciales automatizadas para distribuidor,
            lista de precios, lista de precios tradicional y clientes.
          </p>
        </div>
        
        <ExcelProcessorComponent />
      </div>
    </div>
  );
}