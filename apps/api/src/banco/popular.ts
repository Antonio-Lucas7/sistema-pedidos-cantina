import { banco } from "./conexao";

banco.run("DELETE FROM pedidos");
banco.run("DELETE FROM itens");
banco.run("DELETE FROM sqlite_sequence"); // reinicia os ids

const inserir = banco.query("INSERT INTO itens (nome, preco_centavos) VALUES (?, ?)");
inserir.run("Sanduíche", 850);
inserir.run("Coxinha", 700);
inserir.run("Suco", 600);
inserir.run("Refrigerante", 550);

console.log("✅ Cardápio de exemplo inserido.");
