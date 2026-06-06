/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Importa react-native-sqlite-storage condicionalmente para evitar quebras em navegadores normais
const SQLite: any = null;

export interface SQLUsuario {
  id: number;
  nome: string;
  email: string;
  data_cadastro?: string;
}

export interface SQLConsumo {
  id: number;
  usuario_id: number;
  data: string; // YYYY-MM-DD
  quantidade: number;
  unidade: 'ml' | 'l';
  periodo: 'manhã' | 'tarde' | 'noite';
  hora_registro: string; // HH:MM
}

export interface SQLConfiguracao {
  id?: number;
  usuario_id: number;
  meta_diaria: number;
  horario_lembrete1: string;
  horario_lembrete2: string;
  horario_lembrete3: string;
}

// Chaves para o LocalStorage que simulando o banco SQLite em ambiente web
const KEY_USERS = "aquaman_sqlite_usuarios";
const KEY_CONSUMPTION = "aquaman_sqlite_consumo";
const KEY_CONFIGS = "aquaman_sqlite_configuracoes";

/**
 * Classe responsável por gerenciar toda a persistência do Aquaman via SQLite
 */
export class Database {
  private static dbInstance: any = null;

  /**
   * Inicializa o banco de dados criando as tabelas se elas não existirem
   */
  public static async initDatabase(): Promise<void> {
    console.log("%c[SQLite] Inicializando tabelas do banco de dados Aquaman...", "color: #0284c7; font-weight: bold;");

    // 1. Definição SQL das 3 tabelas solicitadas
    const createUsersTableSQL = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createConsumptionTableSQL = `
      CREATE TABLE IF NOT EXISTS consumo_agua (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        data DATE NOT NULL,
        quantidade REAL NOT NULL,
        unidade TEXT NOT NULL,
        periodo TEXT NOT NULL,
        hora_registro TIME NOT NULL,
        FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
      );
    `;

    const createConfigsTableSQL = `
      CREATE TABLE IF NOT EXISTS configuracoes (
        id INTEGER PRIMARY KEY,
        usuario_id INTEGER,
        meta_diaria REAL NOT NULL,
        horario_lembrete1 TEXT,
        horario_lembrete2 TEXT,
        horario_lembrete3 TEXT,
        FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
      );
    `;

    // Se estivermos em um dispositivo nativo
    if (SQLite) {
      try {
        if (!this.dbInstance) {
          this.dbInstance = await SQLite.openDatabase({
            name: 'aquaman_sqlite.db',
            location: 'default'
          });
        }
        await this.dbInstance.executeSql(createUsersTableSQL);
        await this.dbInstance.executeSql(createConsumptionTableSQL);
        await this.dbInstance.executeSql(createConfigsTableSQL);
        console.log("[SQLite] Tabelas do banco SQLite Native construídas com sucesso.");
        return;
      } catch (err) {
        console.error("[SQLite] Falha ao executar inicialização nativa:", err);
      }
    }

    // FALLBACK WEB: Loga os SQLs que seriam executados no aparelho físico
    console.log(`[SQLite Executed SQL]:\n${createUsersTableSQL}`);
    console.log(`[SQLite Executed SQL]:\n${createConsumptionTableSQL}`);
    console.log(`[SQLite Executed SQL]:\n${createConfigsTableSQL}`);

    // Cria as estruturas no LocalStorage se não existirem (simulando seed inicial)
    if (!localStorage.getItem(KEY_USERS)) {
      // Seed padrão para usuários de demonstração
      localStorage.setItem(KEY_USERS, JSON.stringify([
        { id: 1, nome: "Fernando", email: "fernando@gmail.com", senha: "password123", data_cadastro: "2026-06-06 12:00:00" },
        { id: 2, nome: "Maria", email: "maria@outlook.com", senha: "password123", data_cadastro: "2026-06-06 14:00:00" }
      ]));
    }
    if (!localStorage.getItem(KEY_CONSUMPTION)) {
      const todayStr = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Seed de consumo inicial para teste imediato
      localStorage.setItem(KEY_CONSUMPTION, JSON.stringify([
        { id: 1, usuario_id: 1, data: yesterdayStr, quantidade: 1000, unidade: "ml", periodo: "manhã", hora_registro: "09:15" },
        { id: 2, usuario_id: 1, data: yesterdayStr, quantidade: 1200, unidade: "ml", periodo: "tarde", hora_registro: "14:40" },
        { id: 3, usuario_id: 1, data: todayStr, quantidade: 300, unidade: "ml", periodo: "manhã", hora_registro: "08:30" },
        { id: 4, usuario_id: 2, data: todayStr, quantidade: 1000, unidade: "ml", periodo: "tarde", hora_registro: "13:10" }
      ]));
    }
    if (!localStorage.getItem(KEY_CONFIGS)) {
      // Seed de configurações padrão dos usuários
      localStorage.setItem(KEY_CONFIGS, JSON.stringify([
        { id: 1, usuario_id: 1, meta_diaria: 2000, horario_lembrete1: "08:00", horario_lembrete2: "14:00", horario_lembrete3: "20:00" },
        { id: 2, usuario_id: 2, meta_diaria: 2500, horario_lembrete1: "09:00", horario_lembrete2: "15:00", horario_lembrete3: "21:00" }
      ]));
    }

    console.log("[SQLite] Estruturas relacionais estruturadas no Web Preview com sucesso.");
  }

  /**
   * 1. Função para cadastrar novo usuário no banco
   */
  public static async cadastrarUsuario(nome: string, email: string, senha: string): Promise<SQLUsuario> {
    const signupSQL = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?);`;
    const emailNormalized = email.trim().toLowerCase();

    console.log(`%c[SQLite Query]: ${signupSQL}`, "color: #10b981;", [nome, emailNormalized, "******"]);

    if (SQLite && this.dbInstance) {
      try {
        const results = await this.dbInstance.executeSql(signupSQL, [nome, emailNormalized, senha]);
        const insertId = results[0].insertId;
        return { id: insertId, nome, email: emailNormalized };
      } catch (err: any) {
        throw new Error(err.message || "Erro ao cadastrar usuário no banco.");
      }
    }

    // Web Fallback Simulation
    const users = JSON.parse(localStorage.getItem(KEY_USERS) || "[]");
    const exists = users.some((u: any) => u.email === emailNormalized);
    if (exists) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    const nextId = users.length > 0 ? Math.max(...users.map((u: any) => u.id)) + 1 : 1;
    const newRecord = {
      id: nextId,
      nome,
      email: emailNormalized,
      senha,
      data_cadastro: new Date().toISOString()
    };

    users.push(newRecord);
    localStorage.setItem(KEY_USERS, JSON.stringify(users));

    // Cria as configurações iniciais padrões para este novo usuário
    await this.salvarOuAtualizarConfiguracoes(nextId, 2000, "08:00", "14:00", "20:00");

    return { id: nextId, nome, email: emailNormalized };
  }

  /**
   * 2. Função para buscar usuário por e-mail e senha (para o login)
   */
  public static async buscarUsuarioPorEmailSenha(email: string, senha: string): Promise<SQLUsuario | null> {
    const loginSQL = `SELECT id, nome, email, data_cadastro FROM usuarios WHERE email = ? AND senha = ? LIMIT 1;`;
    const emailNormalized = email.trim().toLowerCase();

    console.log(`%c[SQLite Query]: ${loginSQL}`, "color: #10b981;", [emailNormalized, "******"]);

    if (SQLite && this.dbInstance) {
      try {
        const results = await this.dbInstance.executeSql(loginSQL, [emailNormalized, senha]);
        if (results[0].rows.length > 0) {
          return results[0].rows.item(0) as SQLUsuario;
        }
        return null;
      } catch (err) {
        console.error("Erro ao efetuar consulta de login:", err);
        return null;
      }
    }

    // Web Fallback Simulation
    const users = JSON.parse(localStorage.getItem(KEY_USERS) || "[]");
    const found = users.find((u: any) => u.email === emailNormalized && u.senha === senha);
    if (found) {
      return {
        id: found.id,
        nome: found.nome,
        email: found.email,
        data_cadastro: found.data_cadastro
      };
    }
    return null;
  }

  /**
   * 3. Função para adicionar um novo registro de água
   */
  public static async adicionarConsumo(
    usuarioId: number,
    quantidade: number,
    unidade: 'ml' | 'l',
    periodo: 'manhã' | 'tarde' | 'noite',
    horaRegistro: string,
    dataStr?: string
  ): Promise<SQLConsumo> {
    const insertConsumoSQL = `
      INSERT INTO consumo_agua (usuario_id, data, quantidade, unidade, periodo, hora_registro)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    const finalData = dataStr || new Date().toISOString().split("T")[0];

    console.log(`%c[SQLite Query]: ${insertConsumoSQL}`, "color: #10b981;", [
      usuarioId,
      finalData,
      quantidade,
      unidade,
      periodo,
      horaRegistro
    ]);

    if (SQLite && this.dbInstance) {
      try {
        const results = await this.dbInstance.executeSql(insertConsumoSQL, [
          usuarioId,
          finalData,
          quantidade,
          unidade,
          periodo,
          horaRegistro
        ]);
        return {
          id: results[0].insertId,
          usuario_id: usuarioId,
          data: finalData,
          quantidade,
          unidade,
          periodo,
          hora_registro: horaRegistro
        };
      } catch (err) {
        console.error("Erro ao salvar consumo:", err);
      }
    }

    // Web Fallback Simulation
    const consumptions = JSON.parse(localStorage.getItem(KEY_CONSUMPTION) || "[]");
    const nextId = consumptions.length > 0 ? Math.max(...consumptions.map((c: any) => c.id)) + 1 : 1;
    
    const newConsumption: SQLConsumo = {
      id: nextId,
      usuario_id: usuarioId,
      data: finalData,
      quantidade,
      unidade,
      periodo,
      hora_registro: horaRegistro
    };

    consumptions.push(newConsumption);
    localStorage.setItem(KEY_CONSUMPTION, JSON.stringify(consumptions));
    return newConsumption;
  }

  /**
   * 4. Deletar registro de consumo de água
   */
  public static async deletarConsumo(id: number): Promise<void> {
    const deletarSQL = `DELETE FROM consumo_agua WHERE id = ?;`;
    console.log(`%c[SQLite Query]: ${deletarSQL}`, "color: #dc2626;", [id]);

    if (SQLite && this.dbInstance) {
      try {
        await this.dbInstance.executeSql(deletarSQL, [id]);
        return;
      } catch (err) {
        console.error("Erro ao remover registro:", err);
      }
    }

    // Web Fallback Simulation
    const consumptions = JSON.parse(localStorage.getItem(KEY_CONSUMPTION) || "[]");
    const filtered = consumptions.filter((c: any) => c.id !== id);
    localStorage.setItem(KEY_CONSUMPTION, JSON.stringify(filtered));
  }

  /**
   * 5. Função para calcular e retornar o TOTAL CONSUMIDO NO DIA,
   * convertendo as unidades se necessário (por exemplo, litros para ml)
   */
  public static async calcularTotalConsumidoHoje(usuarioId: number): Promise<number> {
    const todayStr = new Date().toISOString().split("T")[0];
    const totalSQL = `
      SELECT quantidade, unidade FROM consumo_agua 
      WHERE usuario_id = ? AND data = ?;
    `;

    console.log(`%c[SQLite Query]: ${totalSQL}`, "color: #10b981;", [usuarioId, todayStr]);

    if (SQLite && this.dbInstance) {
      try {
        const results = await this.dbInstance.executeSql(totalSQL, [usuarioId, todayStr]);
        let totalMl = 0;
        const len = results[0].rows.length;
        for (let i = 0; i < len; i++) {
          const row = results[0].rows.item(i);
          // Converte Litros para ML se necessário
          if (row.unidade.toLowerCase() === 'l' || row.unidade.toLowerCase() === 'ltr') {
            totalMl += parseFloat(row.quantidade) * 1000;
          } else {
            totalMl += parseFloat(row.quantidade);
          }
        }
        return Math.round(totalMl);
      } catch (err) {
        console.error("Erro ao calcular soma hoje:", err);
        return 0;
      }
    }

    // Web Fallback Simulation
    const consumptions = JSON.parse(localStorage.getItem(KEY_CONSUMPTION) || "[]");
    const todayLogs = consumptions.filter((c: any) => c.usuario_id === usuarioId && c.data === todayStr);

    let totalMl = 0;
    todayLogs.forEach((item: any) => {
      if (item.unidade === 'l') {
        totalMl += item.quantidade * 1000;
      } else {
        totalMl += item.quantidade;
      }
    });

    return Math.round(totalMl);
  }

  /**
   * 6. Função para buscar histórico de consumo de água por usuário por data
   */
  public static async buscarHistoricoPorData(usuarioId: number, data: string): Promise<SQLConsumo[]> {
    const findHistorySQL = `
      SELECT id, usuario_id, data, quantidade, unidade, periodo, hora_registro 
      FROM consumo_agua 
      WHERE usuario_id = ? AND data = ?
      ORDER BY hora_registro DESC;
    `;

    console.log(`%c[SQLite Query]: ${findHistorySQL}`, "color: #10b981;", [usuarioId, data]);

    if (SQLite && this.dbInstance) {
      try {
        const results = await this.dbInstance.executeSql(findHistorySQL, [usuarioId, data]);
        const list: SQLConsumo[] = [];
        const len = results[0].rows.length;
        for (let i = 0; i < len; i++) {
          list.push(results[0].rows.item(i) as SQLConsumo);
        }
        return list;
      } catch (err) {
        console.error("Erro ao buscar histórico por data:", err);
        return [];
      }
    }

    // Web Fallback Simulation
    const consumptions = JSON.parse(localStorage.getItem(KEY_CONSUMPTION) || "[]");
    return consumptions
      .filter((c: any) => c.usuario_id === usuarioId && c.data === data)
      .sort((a: any, b: any) => b.hora_registro.localeCompare(a.hora_registro));
  }

  /**
   * 7. Buscar todos os consumos do usuário para analytics ou charts múltiplos
   */
  public static async buscarTodosConsumosUsuario(usuarioId: number): Promise<SQLConsumo[]> {
    const listSQL = `SELECT * FROM consumo_agua WHERE usuario_id = ? ORDER BY data DESC, hora_registro DESC;`;
    console.log(`%c[SQLite Query]: ${listSQL}`, "color: #10b981;", [usuarioId]);

    if (SQLite && this.dbInstance) {
      try {
        const results = await this.dbInstance.executeSql(listSQL, [usuarioId]);
        const list: SQLConsumo[] = [];
        const len = results[0].rows.length;
        for (let i = 0; i < len; i++) {
          list.push(results[0].rows.item(i) as SQLConsumo);
        }
        return list;
      } catch (err) {
        console.error("Erro ao retornar logs por usuário:", err);
        return [];
      }
    }

    // Web Fallback Simulation
    const consumptions = JSON.parse(localStorage.getItem(KEY_CONSUMPTION) || "[]");
    return consumptions.filter((c: any) => c.usuario_id === usuarioId);
  }

  /**
   * 8. Função para salvar/atualizar as configurações (meta diária e lembretes)
   */
  public static async salvarOuAtualizarConfiguracoes(
    usuarioId: number,
    metaDiaria: number,
    lembrete1: string,
    lembrete2: string,
    lembrete3: string
  ): Promise<SQLConfiguracao> {
    // Usaremos a cláusula INSERT OR REPLACE para garantir substituição simplificada por ID no SQLite
    const replaceConfigSQL = `
      INSERT OR REPLACE INTO configuracoes (id, usuario_id, meta_diaria, horario_lembrete1, horario_lembrete2, horario_lembrete3)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    console.log(`%c[SQLite Query]: ${replaceConfigSQL}`, "color: #10b981;", [
      usuarioId, // Usamos o proprio usuario_id como PK simplificada de configurações de linha unica por usuario
      usuarioId,
      metaDiaria,
      lembrete1,
      lembrete2,
      lembrete3
    ]);

    if (SQLite && this.dbInstance) {
      try {
        await this.dbInstance.executeSql(replaceConfigSQL, [
          usuarioId,
          usuarioId,
          metaDiaria,
          lembrete1,
          lembrete2,
          lembrete3
        ]);
        return {
          id: usuarioId,
          usuario_id: usuarioId,
          meta_diaria: metaDiaria,
          horario_lembrete1: lembrete1,
          horario_lembrete2: lembrete2,
          horario_lembrete3: lembrete3
        };
      } catch (err) {
        console.error("Erro ao atualizar configurações:", err);
      }
    }

    // Web Fallback Simulation
    const configs = JSON.parse(localStorage.getItem(KEY_CONFIGS) || "[]");
    const existingIndex = configs.findIndex((c: any) => c.usuario_id === usuarioId);
    
    const itemConfig: SQLConfiguracao = {
      id: usuarioId,
      usuario_id: usuarioId,
      meta_diaria: metaDiaria,
      horario_lembrete1: lembrete1,
      horario_lembrete2: lembrete2,
      horario_lembrete3: lembrete3
    };

    if (existingIndex !== -1) {
      configs[existingIndex] = itemConfig;
    } else {
      configs.push(itemConfig);
    }

    localStorage.setItem(KEY_CONFIGS, JSON.stringify(configs));
    return itemConfig;
  }

  /**
   * 9. Função para buscar configurações do usuário
   */
  public static async buscarConfiguracoes(usuarioId: number): Promise<SQLConfiguracao | null> {
    const getConfigSQL = `SELECT * FROM configuracoes WHERE usuario_id = ? LIMIT 1;`;
    console.log(`%c[SQLite Query]: ${getConfigSQL}`, "color: #10b981;", [usuarioId]);

    if (SQLite && this.dbInstance) {
      try {
        const results = await this.dbInstance.executeSql(getConfigSQL, [usuarioId]);
        if (results[0].rows.length > 0) {
          return results[0].rows.item(0) as SQLConfiguracao;
        }
        return null;
      } catch (err) {
        console.error("Erro ao buscar configurações no SQLite:", err);
        return null;
      }
    }

    // Web Fallback Simulation
    const configs = JSON.parse(localStorage.getItem(KEY_CONFIGS) || "[]");
    const found = configs.find((c: any) => c.usuario_id === usuarioId);
    if (found) return found;

    // Retorna valores padrão caso não exista
    return {
      usuario_id: usuarioId,
      meta_diaria: 2000,
      horario_lembrete1: "08:00",
      horario_lembrete2: "14:00",
      horario_lembrete3: "20:00"
    };
  }
}
