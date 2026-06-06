/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from "./supabase";

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

/**
 * Classe responsável por gerenciar toda a persistência do Aquaman via Supabase (Cloud Database PostgreSQL)
 */
export class Database {
  /**
   * Inicializa a conexão com o Supabase.
   * Não precisa criar tabelas em tempo de execução no cliente,
   * pois o banco de dados do Supabase é estruturado no painel na nuvem via SQL script.
   */
  public static async initDatabase(): Promise<void> {
    console.log("%c[Supabase] Inicializando conexão e sincronizações do banco de dados Aquaman...", "color: #10b981; font-weight: bold;");
    
    try {
      // Faz um ping leve para validar que a chave pública e a URL estão corretas
      const { data, error } = await supabase.from('usuarios').select('id').limit(1);
      if (error) {
        console.warn("[Supabase Warning] Falha na verificação inicial das tabelas. Certifique-se de executar as tabelas no painel do Supabase.", error);
      } else {
        console.log("[Supabase] Conexão com o banco na nuvem estabelecida com sucesso! Tabelas acessíveis.");
      }
    } catch (e) {
      console.error("[Supabase] Erro de rede ou CORS na inicialização:", e);
    }
  }

  /**
   * 1. Cadastra novo usuário no Supabase
   */
  public static async cadastrarUsuario(nome: string, email: string, senha: string): Promise<SQLUsuario> {
    const emailNormalized = email.trim().toLowerCase();

    // Verifica se já existe um usuário cadastrado com esse e-mail no Supabase
    const { data: existing, error: checkError } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', emailNormalized)
      .maybeSingle();

    if (checkError) {
      console.error("Erro ao verificar email no Supabase:", checkError);
      throw new Error("Erro na verificação de autenticação: " + checkError.message);
    }

    if (existing) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    // Insere o novo usuário
    const { data: newUser, error: insertError } = await supabase
      .from('usuarios')
      .insert([{
        nome,
        email: emailNormalized,
        senha
      }])
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao inserir usuário no Supabase:", insertError);
      throw new Error("Erro ao salvar cadastro do usuário: " + insertError.message);
    }

    const userId = Number(newUser.id);

    // Cria as configurações iniciais padrões para o usuário no Supabase
    try {
      await this.salvarOuAtualizarConfiguracoes(userId, 2000, "08:00", "14:00", "20:00");
    } catch (configError) {
      console.warn("Falha ao criar configurações default automáticas:", configError);
    }

    return {
      id: userId,
      nome: newUser.nome,
      email: newUser.email,
      data_cadastro: newUser.data_cadastro
    };
  }

  /**
   * 2. Busca usuário por e-mail e senha (para o login) no Supabase
   */
  public static async buscarUsuarioPorEmailSenha(email: string, senha: string): Promise<SQLUsuario | null> {
    const emailNormalized = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, data_cadastro')
      .eq('email', emailNormalized)
      .eq('senha', senha)
      .maybeSingle();

    if (error) {
      console.error("Erro ao efetuar consulta de login no Supabase:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: Number(data.id),
      nome: data.nome,
      email: data.email,
      data_cadastro: data.data_cadastro
    };
  }

  /**
   * 3. Adiciona um novo registro de consumo de água no Supabase
   */
  public static async adicionarConsumo(
    usuarioId: number,
    quantidade: number,
    unidade: 'ml' | 'l',
    periodo: 'manhã' | 'tarde' | 'noite',
    horaRegistro: string,
    dataStr?: string
  ): Promise<SQLConsumo> {
    const finalData = dataStr || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from('consumo_agua')
      .insert([{
        usuario_id: usuarioId,
        data: finalData,
        quantidade,
        unidade,
        periodo,
        hora_registro: horaRegistro
      }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar consumo no Supabase:", error);
      throw new Error("Erro ao salvar consumo de água na nuvem: " + error.message);
    }

    return {
      id: Number(data.id),
      usuario_id: Number(data.usuario_id),
      data: data.data,
      quantidade: Number(data.quantidade),
      unidade: data.unidade as 'ml' | 'l',
      periodo: data.periodo as 'manhã' | 'tarde' | 'noite',
      hora_registro: data.hora_registro
    };
  }

  /**
   * 4. Deletar registro de consumo de água no Supabase
   */
  public static async deletarConsumo(id: number): Promise<void> {
    const { error } = await supabase
      .from('consumo_agua')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Erro ao remover registro no Supabase:", error);
      throw new Error("Erro ao deletar consumo de água na nuvem: " + error.message);
    }
  }

  /**
   * 5. Calcula o total consumido HOJE pelo usuário, convertendo as unidades se necessário
   */
  public static async calcularTotalConsumidoHoje(usuarioId: number): Promise<number> {
    const todayStr = new Date().toISOString().split("T")[0];

    // Busca apenas os logs de hoje do usuário atual
    const { data, error } = await supabase
      .from('consumo_agua')
      .select('quantidade, unidade')
      .eq('usuario_id', usuarioId)
      .eq('data', todayStr);

    if (error) {
      console.error("Erro ao calcular soma hoje com o Supabase:", error);
      return 0;
    }

    let totalMl = 0;
    if (data) {
      data.forEach((row: any) => {
        const quantidade = parseFloat(row.quantidade);
        if (row.unidade.toLowerCase() === 'l' || row.unidade.toLowerCase() === 'ltr') {
          totalMl += quantidade * 1000;
        } else {
          totalMl += quantidade;
        }
      });
    }

    return Math.round(totalMl);
  }

  /**
   * 6. Busca histórico de consumo de água do usuário por data
   */
  public static async buscarHistoricoPorData(usuarioId: number, data: string): Promise<SQLConsumo[]> {
    const { data: records, error } = await supabase
      .from('consumo_agua')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('data', data)
      .order('hora_registro', { ascending: false });

    if (error) {
      console.error("Erro ao buscar histórico por data no Supabase:", error);
      return [];
    }

    return (records || []).map((r: any) => ({
      id: Number(r.id),
      usuario_id: Number(r.usuario_id),
      data: r.data,
      quantidade: Number(r.quantidade),
      unidade: r.unidade as 'ml' | 'l',
      periodo: r.periodo as 'manhã' | 'tarde' | 'noite',
      hora_registro: r.hora_registro
    }));
  }

  /**
   * 7. Busca todos os consumos do usuário para analytics ou charts múltiplos
   */
  public static async buscarTodosConsumosUsuario(usuarioId: number): Promise<SQLConsumo[]> {
    const { data: records, error } = await supabase
      .from('consumo_agua')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('data', { ascending: false })
      .order('hora_registro', { ascending: false });

    if (error) {
      console.error("Erro ao retornar logs por usuário no Supabase:", error);
      return [];
    }

    return (records || []).map((r: any) => ({
      id: Number(r.id),
      usuario_id: Number(r.usuario_id),
      data: r.data,
      quantidade: Number(r.quantidade),
      unidade: r.unidade as 'ml' | 'l',
      periodo: r.periodo as 'manhã' | 'tarde' | 'noite',
      hora_registro: r.hora_registro
    }));
  }

  /**
   * 8. Salva ou atualiza as configurações (meta diária e lembretes) no Supabase
   */
  public static async salvarOuAtualizarConfiguracoes(
    usuarioId: number,
    metaDiaria: number,
    lembrete1: string,
    lembrete2: string,
    lembrete3: string
  ): Promise<SQLConfiguracao> {
    const { data, error } = await supabase
      .from('configuracoes')
      .upsert({
        usuario_id: usuarioId,
        meta_diaria: metaDiaria,
        horario_lembrete1: lembrete1,
        horario_lembrete2: lembrete2,
        horario_lembrete3: lembrete3
      }, { onConflict: 'usuario_id' })
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar configurações no Supabase:", error);
      throw new Error("Erro ao atualizar configurações na nuvem: " + error.message);
    }

    return {
      id: Number(data.id),
      usuario_id: Number(data.usuario_id),
      meta_diaria: Number(data.meta_diaria),
      horario_lembrete1: data.horario_lembrete1,
      horario_lembrete2: data.horario_lembrete2,
      horario_lembrete3: data.horario_lembrete3
    };
  }

  /**
   * 9. Busca configurações do usuário no Supabase
   */
  public static async buscarConfiguracoes(usuarioId: number): Promise<SQLConfiguracao | null> {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar configurações no Supabase:", error);
      return null;
    }

    if (data) {
      return {
        id: Number(data.id),
        usuario_id: Number(data.usuario_id),
        meta_diaria: Number(data.meta_diaria),
        horario_lembrete1: data.horario_lembrete1,
        horario_lembrete2: data.horario_lembrete2,
        horario_lembrete3: data.horario_lembrete3
      };
    }

    // Retorna valores padrão caso não exista nas tabelas do Supabase
    return {
      usuario_id: usuarioId,
      meta_diaria: 2000,
      horario_lembrete1: "08:00",
      horario_lembrete2: "14:00",
      horario_lembrete3: "20:00"
    };
  }
}
