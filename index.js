
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

interface CarbonActivity {
  description: string;
  category: string;
  frequency: string;
  estimatedEmissions: number;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const systemPrompt = `Eres un experto en sostenibilidad y cálculo de huella de carbono. Tu función es ayudar a los usuarios a evaluar y calcular su huella de carbono personal de manera conversacional.

Cuando el usuario te proporcione información sobre sus actividades (transporte, consumo de energía, alimentación, etc.), debes:
1. Extraer la información relevante sobre sus hábitos
2. Estimar las emisiones de CO2 equivalente basándote en estándares científicos
3. Proporcionar información sobre cómo reducir su huella de carbono
4. Mantener un registro de todas las actividades mencionadas

Usa estas estimaciones aproximadas para el cálculo:
- Conducir auto (gasolina): 0.21 kg CO2/km
- Conducir auto (eléctrico): 0.05 kg CO2/km
- Transporte público: 0.10 kg CO2/km
- Vuelo doméstico: 0.29 kg CO2/km
- Vuelo internacional: 0.16 kg CO2/km
- Electricidad: 0.42 kg CO2/kWh (promedio)
- Gas natural: 2.04 kg CO2/m3
- Carne de res: 27 kg CO2/kg
- Pollo: 6.9 kg CO2/kg
- Verduras: 2 kg CO2/kg
- Lácteos: 1.23 kg CO2/kg

Sé conversacional, amigable y educativo. Si el usuario no proporciona suficientes detalles, haz preguntas aclaratorias.`;

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const conversationHistory: ConversationMessage[] = [];
  let totalEmissions = 0;
  const activities: CarbonActivity[] = [];

  console.log("🌍 Bienvenido a la Calculadora de Huella de Carbono Personal");
  console.log(
    "━".repeat(60)
  );
  console.log("Cuéntame sobre tus actividades diarias y calcularemos tu huella");
  console.log("de carbono. Escribe 'salir' para terminar.");
  console.log(
    "━".repeat(60)
  );

  const askQuestion = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  };

  // Initial greeting from Claude
  const initialGreeting = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content:
          "Hola, quiero calcular mi huella de carbono personal. ¿Por dónde empezamos?",
      },
    ],
  });

  const greetingText =
    initialGreeting.content[0].type === "text"
      ? initialGreeting.content[0].text
      : "";
  console.log("\n🤖 Asistente:", greetingText);
  conversationHistory.push({
    role: "user",
    content:
      "Hola, quiero calcular mi huella de carbono personal. ¿Por dónde empezamos?",
  });
  conversationHistory.push({
    role: "assistant",
    content: greetingText,
  });

  // Main conversation loop
  while (true) {
    const userInput = await askQuestion("\n👤 Tú: ");

    if (userInput.toLowerCase() === "salir") {
      console.log("\n" + "━".repeat(60));
      console.log("📊 Resumen Final de Tu Huella de Carbono:");
      console.log("━".repeat(60));

      if (activities.length > 0) {
        console.log("\nActividades registradas:");
        for (const activity of activities) {
          console.log(
            `  • ${activity.description} (${activity.category}): ${activity.estimatedEmissions.toFixed(2)} kg CO2`
          );
        }
        console.log(
          `\n📈 Emisiones totales calculadas: ${totalEmissions.toFixed(2)} kg CO2`
        );

        const dailyAverage = totalEmissions / 365;
        const annualEstimate = totalEmissions * 365;
        console.log(
          `   Promedio diario estimado: ${(dailyAverage / 365).toFixed(3)} kg CO2/día`
        );
        console.log(
          `   Estimado anual: ${annualEstimate.toFixed(2)} kg CO2/año`
        );
      } else {
        console.log("No se registraron actividades en esta sesión.");
      }

      console.log("\n💡 Recuerda: Pequeños cambios en tus hábitos pueden");
      console.log("reducir significativamente tu huella de carbono.");
      console.log("━".repeat(60));
      rl.close();
      break;
    }

    conversationHistory.push({
      role: "user",
      content: userInput,
    });

    try {
      const response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024