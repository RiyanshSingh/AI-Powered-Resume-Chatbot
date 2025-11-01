import { buildEmbeddingIndex } from "../lib/embeddings";
buildEmbeddingIndex().then(()=>{
  console.log("Embeddings built.");
}).catch(err=>{
  console.error(err);
  process.exit(1);
});
