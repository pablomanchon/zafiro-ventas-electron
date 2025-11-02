import { toast } from "react-toastify";
import DynamicForm, { type FormInput } from "../layout/DynamicForm";
import { useMemo } from "react";

export default function Login() {
  const inputs: FormInput[] = useMemo(
    () => [
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        value: "",
      },
      {
        name: "password",
        label: "Contraseña",
        type: "password",
        required: true,
        value: "",
      },
      {
        name: "remember",
        label: "Recordarme",
        type: "checkbox",
        value: true,
      },
    ],
    []
  );

  async function handleSubmit(values: Record<string, any>) {
    const { email, password, remember } = values;

    if (!email || !password) {
      toast?.error?.("Completá email y contraseña");
      return;
    }
    console.log("Login form values:", { email, password, remember });
  }

  return (
    <DynamicForm
      titleBtn="Iniciar Sesión"
      inputs={inputs}
      onSubmit={handleSubmit}
    />
  )
}
