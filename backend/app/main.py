from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import SessionLocal
from sqlalchemy import text
from pydantic import BaseModel



class PastaVisitaIn(BaseModel):
    nome: str
    dia_semana: int
    frequencia: str
    data_inicio: str
    ativo: bool = True

class PastaVisitaUpdate(BaseModel):
    nome: str
    dia_semana: int
    frequencia: str
    data_inicio: str
    ativo: bool


class ProgramacaoClienteIn(BaseModel):
    pasta_id: int
    cliente_id_erp: int
    cliente_nome: str
    vendedor_id_erp: int
    vendedor_nome: str
    ordem_rota: int | None = None
    ativo: bool = True

app = FastAPI(
    title="Monitoramento de Visitas",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "status": "online",
        "sistema": "Monitoramento de Visitas"
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/vendedores")
def listar_vendedores():
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT id, codigo_erp, nome, supervisor, ativo
            FROM vendedores
            ORDER BY id
        """))

        return [
            {
                "id": row.id,
                "codigo_erp": row.codigo_erp,
                "nome": row.nome,
                "supervisor": row.supervisor,
                "ativo": row.ativo
            }
            for row in resultado
        ]

    finally:
        db.close()

@app.get("/clientes")
def listar_clientes():
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                id,
                codigo_erp,
                razao_social,
                cidade,
                uf
            FROM clientes
            ORDER BY razao_social
        """))

        return [
            {
                "id": row.id,
                "codigo_erp": row.codigo_erp,
                "razao_social": row.razao_social,
                "cidade": row.cidade,
                "uf": row.uf
            }
            for row in resultado
        ]

    finally:
        db.close()

@app.get("/dashboard")
def dashboard(data: str | None = None):
    db = SessionLocal()

    try:
        sql = """
            SELECT
                COUNT(*) AS visitas,
                COUNT(DISTINCT vendedor_nome) AS vendedores,
                COUNT(DISTINCT cliente_nome_fantasia) AS clientes,
                SUM(CASE WHEN venda_efetivada THEN 1 ELSE 0 END) AS vendas_efetivadas
            FROM vw_visitas
            WHERE (:data IS NULL OR data_visita = CAST(:data AS DATE))
        """

        resultado = db.execute(text(sql), {"data": data}).mappings().first()

        return dict(resultado)

    finally:
        db.close()

@app.get("/visitas")
def listar_visitas():
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                id_visita_erp,
                data_hora_visita,
                cliente_nome_fantasia,
                vendedor_nome,
                tipo_visita,
                latitude,
                longitude,
                possui_geolocalizacao,
                venda_efetivada
            FROM vw_visitas
            ORDER BY data_hora_visita DESC
            LIMIT 500
        """))

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()


@app.get("/ranking")
def ranking_vendedores():
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                vendedor_nome,
                COUNT(*) AS visitas,
                SUM(CASE WHEN venda_efetivada THEN 1 ELSE 0 END) AS vendas_efetivadas
            FROM vw_visitas
            GROUP BY vendedor_nome
            ORDER BY visitas DESC
        """))

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()

@app.get("/analitico-kpis")
def analitico_kpis(
    data_inicial: str | None = None,
    data_final: str | None = None,
    vendedor: str | None = None
):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                COUNT(*) AS total_visitas,
                COUNT(DISTINCT id_cliente_erp) AS clientes_visitados,
                COUNT(DISTINCT id_vendedor_erp) AS vendedores_ativos,
                SUM(CASE WHEN venda_efetivada THEN 1 ELSE 0 END) AS vendas_efetivadas,
                ROUND(
                    SUM(CASE WHEN venda_efetivada THEN 1 ELSE 0 END)::numeric
                    / NULLIF(COUNT(*), 0) * 100,
                    2
                ) AS conversao_percentual
            FROM vw_visitas
            WHERE (:data_inicial IS NULL OR data_visita >= CAST(:data_inicial AS DATE))
              AND (:data_final IS NULL OR data_visita <= CAST(:data_final AS DATE))
              AND (:vendedor IS NULL OR vendedor_nome = :vendedor)
        """), {
            "data_inicial": data_inicial,
            "data_final": data_final,
            "vendedor": vendedor,
        })

        return dict(resultado.mappings().first())

    finally:
        db.close()


@app.get("/analitico-visitas-dia")
def analitico_visitas_dia(
    data_inicial: str | None = None,
    data_final: str | None = None,
    vendedor: str | None = None
):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                data_visita,
                COUNT(*) AS total_visitas,
                SUM(CASE WHEN venda_efetivada THEN 1 ELSE 0 END) AS vendas_efetivadas
            FROM vw_visitas
            WHERE (:data_inicial IS NULL OR data_visita >= CAST(:data_inicial AS DATE))
              AND (:data_final IS NULL OR data_visita <= CAST(:data_final AS DATE))
              AND (:vendedor IS NULL OR vendedor_nome = :vendedor)
            GROUP BY data_visita
            ORDER BY data_visita
        """), {
            "data_inicial": data_inicial,
            "data_final": data_final,
            "vendedor": vendedor,
        })

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()


@app.get("/analitico-tipos-visita")
def analitico_tipos_visita(
    data_inicial: str | None = None,
    data_final: str | None = None,
    vendedor: str | None = None
):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                COALESCE(tipo_visita, 'Sem tipo') AS tipo_visita,
                COUNT(*) AS total
            FROM vw_visitas
            WHERE (:data_inicial IS NULL OR data_visita >= CAST(:data_inicial AS DATE))
              AND (:data_final IS NULL OR data_visita <= CAST(:data_final AS DATE))
              AND (:vendedor IS NULL OR vendedor_nome = :vendedor)
            GROUP BY COALESCE(tipo_visita, 'Sem tipo')
            ORDER BY total DESC
        """), {
            "data_inicial": data_inicial,
            "data_final": data_final,
            "vendedor": vendedor,
        })

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()


@app.get("/analitico-tabela")
def analitico_tabela(
    data_inicial: str | None = None,
    data_final: str | None = None,
    vendedor: str | None = None
):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                id_visita_erp,
                data_hora_visita,
                data_visita,
                id_cliente_erp,
                cliente_nome,
                cliente_nome_fantasia,
                id_vendedor_erp,
                vendedor_nome,
                tipo_visita,
                venda_efetivada,
                possui_geolocalizacao,
                latitude,
                longitude,
                observacao
            FROM vw_visitas
            WHERE (:data_inicial IS NULL OR data_visita >= CAST(:data_inicial AS DATE))
              AND (:data_final IS NULL OR data_visita <= CAST(:data_final AS DATE))
              AND (:vendedor IS NULL OR vendedor_nome = :vendedor)
            ORDER BY data_hora_visita DESC
            LIMIT 1000
        """), {
            "data_inicial": data_inicial,
            "data_final": data_final,
            "vendedor": vendedor,
        })

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()

@app.get("/ranking-comercial")
def ranking_comercial(
    data_inicial: str | None = None,
    data_final: str | None = None
):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                id_vendedor_erp,
                vendedor_nome,
                COUNT(*) AS total_visitas,
                COUNT(DISTINCT id_cliente_erp) AS clientes_visitados,
                SUM(CASE WHEN venda_efetivada THEN 1 ELSE 0 END) AS vendas_efetivadas,
                ROUND(
                    SUM(CASE WHEN venda_efetivada THEN 1 ELSE 0 END)::numeric
                    / NULLIF(COUNT(*), 0) * 100,
                    2
                ) AS conversao_percentual,
                MAX(data_hora_visita) AS ultima_visita
            FROM vw_visitas
            WHERE (:data_inicial IS NULL OR data_visita >= CAST(:data_inicial AS DATE))
              AND (:data_final IS NULL OR data_visita <= CAST(:data_final AS DATE))
            GROUP BY id_vendedor_erp, vendedor_nome
            ORDER BY total_visitas DESC, vendas_efetivadas DESC
        """), {
            "data_inicial": data_inicial,
            "data_final": data_final,
        })

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()

@app.get("/tipos-visita")
def tipos_visita():
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                tipo_visita,
                COUNT(*) AS qtd
            FROM vw_visitas
            GROUP BY tipo_visita
            ORDER BY qtd DESC
        """))

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()


@app.get("/mapa-visitas")
def mapa_visitas(data: str | None = None, vendedor: str | None = None):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                id_visita_erp,
                data_hora_visita,
                data_visita,

                id_cliente_erp,
                cliente_nome,
                cliente_nome_fantasia,

                id_vendedor_erp,
                vendedor_nome,

                tipo_visita,
                observacao,
                venda_efetivada,

                latitude,
                longitude
            FROM vw_visitas
            WHERE possui_geolocalizacao = TRUE
              AND (:data IS NULL OR data_visita = CAST(:data AS DATE))
              AND (
                    :vendedor IS NULL
                    OR vendedor_nome = :vendedor
                    OR CAST(id_vendedor_erp AS TEXT) = :vendedor
              )
            ORDER BY data_hora_visita, id_visita_erp
        """), {
            "data": data,
            "vendedor": vendedor
        })

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()

@app.get("/status-carga")
def status_carga():
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                id,
                inicio_execucao,
                fim_execucao,
                registros_processados,
                status,
                mensagem
            FROM controle_carga
            ORDER BY id DESC
            LIMIT 1
        """))

        row = resultado.mappings().first()

        if not row:
            return {
                "status": "SEM_EXECUCAO",
                "mensagem": "Nenhuma carga registrada."
            }

        return dict(row)

    finally:
        db.close()

@app.get("/datas-visitas")
def datas_visitas():
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT DISTINCT data_visita
            FROM vw_visitas
            ORDER BY data_visita DESC
        """))

        return [
            {"data": str(row.data_visita)}
            for row in resultado
        ]

    finally:
        db.close()

@app.get("/vendedores-visitas")
def vendedores_visitas(data: str | None = None):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT DISTINCT vendedor_nome
            FROM vw_visitas
            WHERE (:data IS NULL OR data_visita = CAST(:data AS DATE))
              AND vendedor_nome IS NOT NULL
            ORDER BY vendedor_nome
        """), {"data": data})

        return [
            {"vendedor_nome": row.vendedor_nome}
            for row in resultado
        ]

    finally:
        db.close()

@app.get("/ranking")
def ranking(data: str | None = None):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                vendedor_nome,
                COUNT(*) AS total_visitas
            FROM vw_visitas
            WHERE (:data IS NULL OR data_visita = CAST(:data AS DATE))
            GROUP BY vendedor_nome
            ORDER BY total_visitas DESC
        """), {"data": data})

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()

@app.get("/ultimas-visitas")
def ultimas_visitas(data: str | None = None):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                data_hora_visita,
                vendedor_nome,
                cliente_nome_fantasia,
                tipo_visita
            FROM vw_visitas
            WHERE (:data IS NULL OR data_visita = CAST(:data AS DATE))
            ORDER BY data_hora_visita DESC
            LIMIT 20
        """), {"data": data})

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()

@app.get("/pastas-visita")
def listar_pastas_visita():
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                id,
                nome,
                dia_semana,
                frequencia,
                data_inicio,
                ativo
            FROM pasta_visita
            ORDER BY dia_semana, nome
        """))

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()


@app.post("/pastas-visita")
def criar_pasta_visita(dados: PastaVisitaIn):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            INSERT INTO pasta_visita (
                nome,
                dia_semana,
                frequencia,
                data_inicio,
                ativo
            )
            VALUES (
                :nome,
                :dia_semana,
                :frequencia,
                CAST(:data_inicio AS DATE),
                :ativo
            )
            RETURNING id
        """), dados.model_dump())

        novo_id = resultado.scalar()
        db.commit()

        return {
            "status": "ok",
            "id": novo_id
        }

    finally:
        db.close()


@app.get("/programacao-cliente")
def listar_programacao_cliente():
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            SELECT
                pc.id,
                pc.pasta_id,
                pv.nome AS pasta_nome,
                pc.cliente_id_erp,
                pc.cliente_nome,
                pc.vendedor_id_erp,
                pc.vendedor_nome,
                pc.ordem_rota,
                pc.ativo
            FROM programacao_cliente pc
            LEFT JOIN pasta_visita pv
                ON pv.id = pc.pasta_id
            ORDER BY pv.dia_semana, pv.nome, pc.ordem_rota
        """))

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()


@app.post("/programacao-cliente")
def criar_programacao_cliente(dados: ProgramacaoClienteIn):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            INSERT INTO programacao_cliente (
                pasta_id,
                cliente_id_erp,
                cliente_nome,
                vendedor_id_erp,
                vendedor_nome,
                ordem_rota,
                ativo
            )
            VALUES (
                :pasta_id,
                :cliente_id_erp,
                :cliente_nome,
                :vendedor_id_erp,
                :vendedor_nome,
                :ordem_rota,
                :ativo
            )
            RETURNING id
        """), dados.model_dump())

        novo_id = resultado.scalar()
        db.commit()

        return {
            "status": "ok",
            "id": novo_id
        }

    finally:
        db.close()
@app.get("/planejado-realizado")
def planejado_realizado(data: str):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            WITH planejado AS (
                SELECT
                    pc.vendedor_id_erp,
                    pc.vendedor_nome,
                    pc.cliente_id_erp,
                    pc.cliente_nome,
                    pc.ordem_rota,
                    pv.nome AS pasta_nome
                FROM programacao_cliente pc
                INNER JOIN pasta_visita pv
                    ON pv.id = pc.pasta_id
                WHERE pc.ativo = TRUE
                  AND pv.ativo = TRUE
            ),

            visitas_dia AS (
                SELECT
                    id_visita_erp,
                    data_visita,
                    id_cliente_erp,
                    id_vendedor_erp,
                    vendedor_nome,
                    cliente_nome_fantasia,
                    tipo_visita
                FROM vw_visitas
                WHERE data_visita = CAST(:data AS DATE)
            ),

            vendedores_base AS (
                SELECT DISTINCT
                    vendedor_id_erp,
                    vendedor_nome
                FROM planejado

                UNION

                SELECT DISTINCT
                    id_vendedor_erp AS vendedor_id_erp,
                    vendedor_nome
                FROM visitas_dia
            ),

            planejado_status AS (
                SELECT
                    p.vendedor_id_erp,
                    p.vendedor_nome,
                    p.cliente_id_erp,
                    CASE
                        WHEN COUNT(v.id_visita_erp) > 0 THEN 1
                        ELSE 0
                    END AS visitado
                FROM planejado p
                LEFT JOIN visitas_dia v
                    ON v.id_cliente_erp = p.cliente_id_erp
                   AND v.id_vendedor_erp = p.vendedor_id_erp
                GROUP BY
                    p.vendedor_id_erp,
                    p.vendedor_nome,
                    p.cliente_id_erp
            ),

            resumo_programado AS (
                SELECT
                    vendedor_id_erp,
                    vendedor_nome,
                    COUNT(*) AS programados,
                    SUM(visitado) AS visitados,
                    COUNT(*) - SUM(visitado) AS nao_visitados
                FROM planejado_status
                GROUP BY
                    vendedor_id_erp,
                    vendedor_nome
            ),

            fora_rota AS (
                SELECT
                    v.id_vendedor_erp AS vendedor_id_erp,
                    v.vendedor_nome,
                    COUNT(*) AS fora_rota
                FROM visitas_dia v
                LEFT JOIN planejado p
                    ON p.cliente_id_erp = v.id_cliente_erp
                   AND p.vendedor_id_erp = v.id_vendedor_erp
                WHERE p.cliente_id_erp IS NULL
                GROUP BY
                    v.id_vendedor_erp,
                    v.vendedor_nome
            )

            SELECT
                vb.vendedor_id_erp,
                vb.vendedor_nome,

                COALESCE(rp.programados, 0) AS programados,
                COALESCE(rp.visitados, 0) AS visitados,
                COALESCE(rp.nao_visitados, 0) AS nao_visitados,

                ROUND(
                    COALESCE(rp.visitados, 0)::numeric
                    / NULLIF(COALESCE(rp.programados, 0), 0) * 100,
                    2
                ) AS percentual,

                COALESCE(fr.fora_rota, 0) AS fora_rota
            FROM vendedores_base vb
            LEFT JOIN resumo_programado rp
                ON rp.vendedor_id_erp = vb.vendedor_id_erp
            LEFT JOIN fora_rota fr
                ON fr.vendedor_id_erp = vb.vendedor_id_erp
            WHERE
                COALESCE(rp.programados, 0) > 0
                OR COALESCE(fr.fora_rota, 0) > 0
            ORDER BY
                percentual DESC NULLS LAST,
                vb.vendedor_nome
        """), {"data": data})

        return [dict(row._mapping) for row in resultado]

    finally:
        db.close()
@app.put("/pastas-visita/{pasta_id}")
def atualizar_pasta_visita(pasta_id: int, dados: PastaVisitaUpdate):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            UPDATE pasta_visita
            SET
                nome = :nome,
                dia_semana = :dia_semana,
                frequencia = :frequencia,
                data_inicio = CAST(:data_inicio AS DATE),
                ativo = :ativo
            WHERE id = :pasta_id
            RETURNING id
        """), {
            "pasta_id": pasta_id,
            "nome": dados.nome,
            "dia_semana": dados.dia_semana,
            "frequencia": dados.frequencia,
            "data_inicio": dados.data_inicio,
            "ativo": dados.ativo,
        })

        atualizado_id = resultado.scalar()

        if atualizado_id is None:
            db.rollback()
            return {
                "status": "erro",
                "mensagem": "Pasta não encontrada."
            }

        db.commit()

        return {
            "status": "ok",
            "id": atualizado_id
        }

    except Exception as e:
        db.rollback()
        print("ERRO AO ATUALIZAR PASTA:", str(e))
        return {
            "status": "erro",
            "mensagem": str(e)
        }

    finally:
        db.close()

@app.get("/planejado-realizado-detalhe")
def planejado_realizado_detalhe(data: str):
    db = SessionLocal()

    try:
        resultado = db.execute(text("""
            WITH planejado AS (
                SELECT
                    pc.vendedor_id_erp,
                    pc.vendedor_nome,
                    pc.cliente_id_erp,
                    pc.cliente_nome,
                    pc.ordem_rota,
                    pv.nome AS pasta_nome
                FROM programacao_cliente pc
                INNER JOIN pasta_visita pv
                    ON pv.id = pc.pasta_id
                WHERE pc.ativo = TRUE
                  AND pv.ativo = TRUE
            ),

            visitas_dia AS (
                SELECT
                    id_visita_erp,
                    data_visita,
                    id_cliente_erp,
                    id_vendedor_erp,
                    vendedor_nome,
                    cliente_nome_fantasia,
                    tipo_visita
                FROM vw_visitas
                WHERE data_visita = CAST(:data AS DATE)
            ),

            planejados_status AS (
                SELECT
                    p.vendedor_id_erp,
                    p.vendedor_nome,
                    p.cliente_id_erp,
                    p.cliente_nome,
                    p.pasta_nome,
                    p.ordem_rota,
                    MIN(v.id_visita_erp) AS id_visita_erp,
                    MAX(v.tipo_visita) AS tipo_visita,
                    CASE
                        WHEN COUNT(v.id_visita_erp) > 0 THEN 'VISITADO'
                        ELSE 'NAO_VISITADO'
                    END AS status
                FROM planejado p
                LEFT JOIN visitas_dia v
                    ON v.id_cliente_erp = p.cliente_id_erp
                   AND v.id_vendedor_erp = p.vendedor_id_erp
                GROUP BY
                    p.vendedor_id_erp,
                    p.vendedor_nome,
                    p.cliente_id_erp,
                    p.cliente_nome,
                    p.pasta_nome,
                    p.ordem_rota
            ),

            fora_rota AS (
                SELECT
                    v.id_vendedor_erp AS vendedor_id_erp,
                    v.vendedor_nome,
                    v.id_cliente_erp AS cliente_id_erp,
                    COALESCE(v.cliente_nome_fantasia, 'Cliente sem nome') AS cliente_nome,
                    'Fora da rota' AS pasta_nome,
                    9999 AS ordem_rota,
                    v.id_visita_erp,
                    v.tipo_visita,
                    'FORA_ROTA' AS status
                FROM visitas_dia v
                LEFT JOIN planejado p
                    ON p.cliente_id_erp = v.id_cliente_erp
                   AND p.vendedor_id_erp = v.id_vendedor_erp
                WHERE p.cliente_id_erp IS NULL
            ),

            base AS (
                SELECT * FROM planejados_status
                UNION ALL
                SELECT * FROM fora_rota
            )

            SELECT
                vendedor_id_erp,
                vendedor_nome,
                cliente_id_erp,
                cliente_nome,
                pasta_nome,
                ordem_rota,
                status,
                id_visita_erp,
                tipo_visita
            FROM base
            ORDER BY
                vendedor_nome,
                ordem_rota,
                cliente_nome
        """), {"data": data})

        linhas = [dict(row._mapping) for row in resultado]

        agrupado = {}

        for linha in linhas:
            vendedor = linha["vendedor_nome"]

            if vendedor not in agrupado:
                agrupado[vendedor] = {
                    "vendedor_id_erp": linha["vendedor_id_erp"],
                    "vendedor_nome": vendedor,
                    "clientes": []
                }

            agrupado[vendedor]["clientes"].append({
                "cliente_id_erp": linha["cliente_id_erp"],
                "cliente_nome": linha["cliente_nome"],
                "pasta_nome": linha["pasta_nome"],
                "ordem_rota": linha["ordem_rota"],
                "status": linha["status"],
                "id_visita_erp": linha["id_visita_erp"],
                "tipo_visita": linha["tipo_visita"],
            })

        return list(agrupado.values())
    
    
    

    

    finally:
        db.close()

        