import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Phone, MessageCircle, CheckCircle, Clock, Bug, HelpCircle } from "lucide-react";

const supportSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Ingrese un email válido"),
  category: z.string().min(1, "Seleccione una categoría"),
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

type SupportFormData = z.infer<typeof supportSchema>;

const Support = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      name: "",
      email: "",
      category: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: SupportFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSuccess(true);
      toast({
        title: "¡Mensaje enviado!",
        description: "Hemos recibido tu consulta. Te responderemos pronto.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Error al enviar",
        description: "No se pudo enviar tu mensaje. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const supportCategories = [
    { value: "technical", label: "Soporte Técnico", icon: Bug },
    { value: "billing", label: "Facturación", icon: Mail },
    { value: "feature", label: "Solicitud de Funcionalidad", icon: HelpCircle },
    { value: "general", label: "Consulta General", icon: MessageCircle },
  ];

  const faqItems = [
    {
      question: "¿Cómo funciona el chatbot?",
      answer: "Nuestro chatbot utiliza IA avanzada para proporcionar respuestas basadas en datos de precios en tiempo real."
    },
    {
      question: "¿Puedo exportar los datos del dashboard?",
      answer: "Sí, puedes exportar todos los datos en formato CSV desde la sección de dashboard."
    },
    {
      question: "¿Hay límite en el número de consultas?",
      answer: "Depende de tu plan. Los usuarios gratuitos tienen 100 consultas por mes."
    },
    {
      question: "¿Cómo verifico mi email?",
      answer: "Revisa tu bandeja de entrada y spam. El enlace de verificación expira en 24 horas."
    }
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elegant border-primary/10">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">¡Mensaje Enviado!</h2>
            <p className="text-muted-foreground mb-4">
              Hemos recibido tu consulta. Nuestro equipo te responderá dentro de las próximas 24 horas.
            </p>
            <div className="space-y-2">
              <Button onClick={() => setIsSuccess(false)} variant="outline" className="w-full">
                Enviar otro mensaje
              </Button>
              <Button asChild className="w-full">
                <Link to="/">Volver al inicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Centro de Soporte
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              ¿Necesitas ayuda? Estamos aquí para asistirte
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-elegant border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Enviar Consulta
                  </CardTitle>
                  <CardDescription>
                    Completa el formulario y te responderemos pronto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input placeholder="Tu nombre" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="tu@email.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {supportCategories.map((category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    <div className="flex items-center gap-2">
                                      <category.icon className="h-4 w-4" />
                                      {category.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asunto</FormLabel>
                            <FormControl>
                              <Input placeholder="Resumen de tu consulta" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mensaje</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe tu consulta o problema en detalle..."
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? "Enviando..." : "Enviar Mensaje"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card className="shadow-elegant border-primary/10">
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">soporte@pricinginteligente.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">+34 900 123 456</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Horario</p>
                      <p className="text-sm text-muted-foreground">Lun-Vie 9:00-18:00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card className="shadow-elegant border-primary/10">
                <CardHeader>
                  <CardTitle>Preguntas Frecuentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {faqItems.map((item, index) => (
                      <div key={index} className="border-b border-border/50 pb-3 last:border-0">
                        <h4 className="font-medium text-sm mb-1">{item.question}</h4>
                        <p className="text-xs text-muted-foreground">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;