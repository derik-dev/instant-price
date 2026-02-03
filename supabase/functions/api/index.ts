// API OrçaFácil - Supabase Edge Function
// Endpoints REST para integração com sistemas terceiros

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Inicializa Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Valida API Key
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return jsonResponse({ error: "API Key não fornecida" }, 401);
        }

        const apiKey = authHeader.replace("Bearer ", "");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Busca API Key e user_id associado
        const { data: keyData, error: keyError } = await supabase
            .from("api_keys")
            .select("user_id")
            .eq("key", apiKey)
            .single();

        if (keyError || !keyData) {
            return jsonResponse({ error: "API Key inválida" }, 401);
        }

        const userId = keyData.user_id;

        // Atualiza last_used_at
        await supabase
            .from("api_keys")
            .update({ last_used_at: new Date().toISOString() })
            .eq("key", apiKey);

        // Parse URL e método
        const url = new URL(req.url);
        const pathParts = url.pathname.split("/").filter(Boolean);
        // pathParts: ["api", "orcamentos"] ou ["api", "orcamentos", "123"]
        const resource = pathParts[1]; // "orcamentos", "clientes", "itens"
        const resourceId = pathParts[2]; // ID opcional

        const method = req.method;
        let body = null;
        if (["POST", "PUT"].includes(method)) {
            body = await req.json();
        }

        // Roteamento
        switch (resource) {
            case "orcamentos":
                return handleOrcamentos(supabase, method, resourceId, body, userId);
            case "clientes":
                return handleClientes(supabase, method, resourceId, body, userId);
            case "itens":
                return handleItens(supabase, method, resourceId, body, userId);
            case "empresa":
                return handleEmpresa(supabase, method, body, userId);
            default:
                return jsonResponse({
                    error: "Recurso não encontrado",
                    recursos_disponiveis: ["orcamentos", "clientes", "itens", "empresa"]
                }, 404);
        }

    } catch (error) {
        console.error("Erro na API:", error);
        return jsonResponse({ error: "Erro interno do servidor" }, 500);
    }
});

// ===== HANDLERS =====

async function handleOrcamentos(supabase: any, method: string, id: string | undefined, body: any, userId: string) {
    const table = "orcamentos";

    switch (method) {
        case "GET":
            if (id) {
                const { data, error } = await supabase.from(table).select("*").eq("id", id).eq("user_id", userId).single();
                if (error) return jsonResponse({ error: "Orçamento não encontrado" }, 404);
                return jsonResponse(data);
            } else {
                const { data, error } = await supabase.from(table).select("*").eq("user_id", userId).order("created_at", { ascending: false });
                if (error) return jsonResponse({ error: error.message }, 500);
                return jsonResponse(data);
            }

        case "POST":
            const novoOrc = { ...body, user_id: userId, status: body.status || "Pendente" };
            const { data: created, error: createErr } = await supabase.from(table).insert([novoOrc]).select().single();
            if (createErr) return jsonResponse({ error: createErr.message }, 400);
            return jsonResponse(created, 201);

        case "PUT":
            if (!id) return jsonResponse({ error: "ID obrigatório" }, 400);
            const { data: updated, error: updateErr } = await supabase.from(table).update(body).eq("id", id).eq("user_id", userId).select().single();
            if (updateErr) return jsonResponse({ error: updateErr.message }, 400);
            return jsonResponse(updated);

        case "DELETE":
            if (!id) return jsonResponse({ error: "ID obrigatório" }, 400);
            const { error: deleteErr } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);
            if (deleteErr) return jsonResponse({ error: deleteErr.message }, 400);
            return jsonResponse({ message: "Orçamento excluído com sucesso" });

        default:
            return jsonResponse({ error: "Método não permitido" }, 405);
    }
}

async function handleClientes(supabase: any, method: string, id: string | undefined, body: any, userId: string) {
    const table = "clientes";

    switch (method) {
        case "GET":
            if (id) {
                const { data, error } = await supabase.from(table).select("*").eq("id", id).eq("user_id", userId).single();
                if (error) return jsonResponse({ error: "Cliente não encontrado" }, 404);
                return jsonResponse(data);
            } else {
                const { data, error } = await supabase.from(table).select("*").eq("user_id", userId).order("nome");
                if (error) return jsonResponse({ error: error.message }, 500);
                return jsonResponse(data);
            }

        case "POST":
            const novoCli = { ...body, user_id: userId };
            const { data: created, error: createErr } = await supabase.from(table).insert([novoCli]).select().single();
            if (createErr) return jsonResponse({ error: createErr.message }, 400);
            return jsonResponse(created, 201);

        case "PUT":
            if (!id) return jsonResponse({ error: "ID obrigatório" }, 400);
            const { data: updated, error: updateErr } = await supabase.from(table).update(body).eq("id", id).eq("user_id", userId).select().single();
            if (updateErr) return jsonResponse({ error: updateErr.message }, 400);
            return jsonResponse(updated);

        case "DELETE":
            if (!id) return jsonResponse({ error: "ID obrigatório" }, 400);
            const { error: deleteErr } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);
            if (deleteErr) return jsonResponse({ error: deleteErr.message }, 400);
            return jsonResponse({ message: "Cliente excluído com sucesso" });

        default:
            return jsonResponse({ error: "Método não permitido" }, 405);
    }
}

async function handleItens(supabase: any, method: string, id: string | undefined, body: any, userId: string) {
    const table = "itens";

    switch (method) {
        case "GET":
            if (id) {
                const { data, error } = await supabase.from(table).select("*").eq("id", id).eq("user_id", userId).single();
                if (error) return jsonResponse({ error: "Item não encontrado" }, 404);
                return jsonResponse(data);
            } else {
                const { data, error } = await supabase.from(table).select("*").eq("user_id", userId).order("nome");
                if (error) return jsonResponse({ error: error.message }, 500);
                return jsonResponse(data);
            }

        case "POST":
            const novoItem = { ...body, user_id: userId };
            const { data: created, error: createErr } = await supabase.from(table).insert([novoItem]).select().single();
            if (createErr) return jsonResponse({ error: createErr.message }, 400);
            return jsonResponse(created, 201);

        case "PUT":
            if (!id) return jsonResponse({ error: "ID obrigatório" }, 400);
            const { data: updated, error: updateErr } = await supabase.from(table).update(body).eq("id", id).eq("user_id", userId).select().single();
            if (updateErr) return jsonResponse({ error: updateErr.message }, 400);
            return jsonResponse(updated);

        case "DELETE":
            if (!id) return jsonResponse({ error: "ID obrigatório" }, 400);
            const { error: deleteErr } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);
            if (deleteErr) return jsonResponse({ error: deleteErr.message }, 400);
            return jsonResponse({ message: "Item excluído com sucesso" });

        default:
            return jsonResponse({ error: "Método não permitido" }, 405);
    }
}

async function handleEmpresa(supabase: any, method: string, body: any, userId: string) {
    const table = "empresas";

    switch (method) {
        case "GET":
            const { data, error } = await supabase.from(table).select("*").eq("user_id", userId).single();
            if (error) return jsonResponse({ error: "Dados da empresa não encontrados" }, 404);
            return jsonResponse(data);

        case "PUT":
            const { data: existente } = await supabase.from(table).select("id").eq("user_id", userId).single();
            if (existente) {
                const { data: updated, error: updateErr } = await supabase.from(table).update(body).eq("id", existente.id).select().single();
                if (updateErr) return jsonResponse({ error: updateErr.message }, 400);
                return jsonResponse(updated);
            } else {
                const novaEmpresa = { ...body, user_id: userId };
                const { data: created, error: createErr } = await supabase.from(table).insert([novaEmpresa]).select().single();
                if (createErr) return jsonResponse({ error: createErr.message }, 400);
                return jsonResponse(created, 201);
            }

        default:
            return jsonResponse({ error: "Método não permitido. Use GET ou PUT." }, 405);
    }
}

// ===== UTILS =====

function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}
