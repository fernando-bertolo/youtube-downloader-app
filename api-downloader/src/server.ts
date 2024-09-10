import fastify from "fastify"
import cors from "@fastify/cors";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { env } from "./env";
import { downloadVideo } from "./routes/download-video";

const app = fastify();


app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cors, {
  origin: '8'
})

app.register(downloadVideo)

app.listen({port: env.PORT}).then(() => {
  console.log("Server running");
})