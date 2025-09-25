import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { User, Shield, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function SettingsPage() {
  const { signOut } = useAuthActions();
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const deleteAccount = useMutation(api.auth.deleteAccount);
  const updateUserProfile = useMutation(api.auth.updateUserProfile);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });

  // Initialize form data when user data loads
  useEffect(() => {
    if (loggedInUser) {
      setFormData({
        name: loggedInUser.name || "",
      });
    }
  }, [loggedInUser]);

  const handleSaveChanges = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre no puede estar vacío.");
      return;
    }

    try {
      setIsUpdating(true);
      await updateUserProfile({
        name: formData.name,
      });
      toast.success("Perfil actualizado con éxito!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("No se pudo actualizar el perfil. Inténtalo de nuevo.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      // After successful deletion, the user will be automatically signed out
      // due to the account being deleted from the database
    } catch (error) {
      console.error("Failed to delete account:", error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la configuración de tu cuenta y preferencias
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del perfil
            </CardTitle>
            <CardDescription>
              Actualiza tu información personal y preferencias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Tu nombre completo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={loggedInUser?.email || ""}
                placeholder="tu.email@ejemplo.com"
                readOnly
              />
              <p className="text-sm text-muted-foreground">
                El email no se puede cambiar en este momento
              </p>
            </div>
            <Button 
              onClick={() => void handleSaveChanges()}
              disabled={isUpdating || !formData.name.trim() || formData.name === (loggedInUser?.name || "")}
            >
              {isUpdating ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Elige qué notificaciones deseas recibir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nuevos Gastos</p>
                  <p className="text-sm text-muted-foreground">
                    Recibe notificaciones cuando alguien agregue un nuevo gasto
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Configurar
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recordatorios de Pago</p>
                  <p className="text-sm text-muted-foreground">
                    Recordatorios sobre pagos pendientes
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Configurar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>
              Administra la configuración de seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 space-y-4">
            <Button
              variant="default"
              onClick={() => void signOut()}
            >
              Cerrar sesión
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Eliminar cuenta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta
                    y eliminará todos tus datos, incluidos:
                    <br />
                    <br />
                    • Todos los grupos que has creado
                    <br />
                    • Todos los gastos que has pagado
                    <br />
                    • Todos los pagos que has realizado o recibido
                    <br />
                    • Tu membresía en todos los grupos
                    <br />
                    <br />
                    Esta acción es <strong>irreversible</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void handleDeleteAccount()}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar cuenta"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}