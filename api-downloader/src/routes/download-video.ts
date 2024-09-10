import ytdl from "ytdl-core";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ClientError } from "../errors/client-error";
const fs = require('fs');
const path = require('path');

export async function downloadVideo(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/download', {
    schema: {
      querystring: z.object({
        urlVideo: z.string().url().min(1, { message: "A URL não pode estar vazia" }),
      }),
    },
  }, async (request, reply) => {
    const { urlVideo } = request.query;

    try {
      if (!urlVideo) {
        throw new ClientError("A URL do vídeo está vazia.");
      }

      const videoId = await ytdl.getURLVideoID(urlVideo);
      const videoInfo = await ytdl.getInfo(urlVideo);

      // Selecionando o formato de vídeo apropriado (qualidade 18 - geralmente 360p)
      const format = ytdl.chooseFormat(videoInfo.formats, { quality: "18" });
      if (!format) {
        throw new ClientError("Formato de vídeo não encontrado.");
      }

      // Definindo o caminho do arquivo de saída
      const outputFileName = `${videoInfo.videoDetails.title}.mp4`;
      const outputFilePath = path.join(__dirname, outputFileName);

      // Criando o stream de saída para salvar o vídeo
      const outputStream = fs.createWriteStream(outputFilePath);

      // Stream do vídeo baixado
      ytdl(urlVideo, { format })
        .pipe(outputStream)
        .on('finish', () => {
          console.log(`Finished downloading: ${outputFilePath}`);
          reply.send({ message: `Download concluído: ${outputFilePath}` });
        })
        .on('error', (err) => {
          console.error(`Erro durante o download: ${err.message}`);
          reply.status(500).send({ message: "Erro ao baixar o vídeo." });
        });
    } catch (error) {
      console.error(`Erro: ${error.message}`);
      reply.status(500).send({ message: "Erro no servidor ao processar o vídeo." });
    }
  });
}
