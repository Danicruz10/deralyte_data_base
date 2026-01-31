import { createClient } from "@supabase/supabase-js";

// Estas llaves las sacas de la configuración de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

export default async function handler(req, res) {
  // Solo permitimos peticiones POST
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const { nombre, email } = req.body;

  try {
    // 1. Buscamos si el email ya existe
    const { data: existente } = await supabase
      .from("registros")
      .select("email, expiracion")
      .eq("email", email.toLowerCase())
      .single();

    if (existente) {
      // Si ya existe, le devolvemos la fecha de expiración que ya tenía
      return res.status(200).json({
        isDuplicate: true,
        expirationTime: existente.expiracion,
        message: "Ya estás registrado",
      });
    }

    // 2. Si es nuevo, calculamos 2 horas desde ahora
    const ahora = new Date().getTime();
    const expiracion = ahora + 2 * 60 * 60 * 1000;

    // 3. Guardamos en la base de datos
    const { error } = await supabase
      .from("registros")
      .insert([{ nombre, email: email.toLowerCase(), expiracion }]);

    if (error) throw error;

    // 4. Respondemos éxito
    return res.status(200).json({
      isDuplicate: false,
      expirationTime: expiracion,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
