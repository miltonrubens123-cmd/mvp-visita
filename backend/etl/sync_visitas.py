import os
from datetime import datetime

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

load_dotenv()

NEON_DATABASE_URL = os.getenv("DATABASE_URL")

ERP_HOST = os.getenv("ERP_HOST")
ERP_PORT = os.getenv("ERP_PORT")
ERP_DATABASE = os.getenv("ERP_DATABASE")
ERP_USER = os.getenv("ERP_USER")
ERP_PASSWORD = os.getenv("ERP_PASSWORD")

if not NEON_DATABASE_URL:
    raise ValueError("DATABASE_URL não encontrada no .env")

if not all([ERP_HOST, ERP_PORT, ERP_DATABASE, ERP_USER, ERP_PASSWORD]):
    raise ValueError("Configurações do ERP incompletas no .env")

ERP_PASSWORD_ENCODED = quote_plus(ERP_PASSWORD)

ERP_DATABASE_URL = (
    f"postgresql+psycopg2://{ERP_USER}:{ERP_PASSWORD_ENCODED}"
    f"@{ERP_HOST}:{ERP_PORT}/{ERP_DATABASE}"
)

engine_neon = create_engine(NEON_DATABASE_URL, pool_pre_ping=True)
engine_erp = create_engine(ERP_DATABASE_URL, pool_pre_ping=True)


def testar_conexao_erp():
    with engine_erp.connect() as conn:
        resultado = conn.execute(text("SELECT NOW()"))
        print("ERP conectado:", resultado.scalar())


def registrar_carga(inicio, fim, registros, status, mensagem):
    with engine_neon.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO controle_carga (
                    inicio_execucao,
                    fim_execucao,
                    registros_processados,
                    status,
                    mensagem
                )
                VALUES (
                    :inicio_execucao,
                    :fim_execucao,
                    :registros_processados,
                    :status,
                    :mensagem
                )
            """),
            {
                "inicio_execucao": inicio,
                "fim_execucao": fim,
                "registros_processados": registros,
                "status": status,
                "mensagem": mensagem,
            },
        )


def buscar_visitas_erp():
    query = """
        SELECT
            cv.i_cdvisita AS id_visita_erp,
            cv.d_visita AS data_hora_visita,
            cv.i_cdcliente AS id_cliente_erp,
            cv.n_latitude AS latitude,
            cv.n_longitude AS longitude,
            cv.i_cdtipo_visita AS id_tipo_visita,
            cv.i_cdvendedor AS id_vendedor_erp,
            cv.c_descricao AS observacao,
            c.c_nome AS cliente_nome,
            c.c_nomefantas AS cliente_nome_fantasia,
            tv.c_descricao AS tipo_visita,
            v.i_cdvendedor AS vendedor_id_erp,
            v.c_nome AS vendedor_nome
        FROM dados.controle_visita cv
        LEFT JOIN dados.cliente c
            ON c.i_cdcliente = cv.i_cdcliente
        LEFT JOIN dados.tipo_visita tv
            ON tv.i_cdtipo_visita = cv.i_cdtipo_visita
        LEFT JOIN dados.vendedor v
            ON v.i_cdvendedor = cv.i_cdvendedor
    """

    return pd.read_sql(query, engine_erp)


def limpar_valores_nan(df: pd.DataFrame):
    return df.where(pd.notnull(df), None)


def upsert_visitas_neon(df: pd.DataFrame):
    if df.empty:
        print("Nenhuma visita encontrada.")
        return 0

    df = limpar_valores_nan(df)

    with engine_neon.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(
                text("""
                    INSERT INTO stg_visitas_erp (
                        id_visita_erp,
                        data_hora_visita,
                        id_cliente_erp,
                        latitude,
                        longitude,
                        id_tipo_visita,
                        id_vendedor_erp,
                        observacao,
                        cliente_nome,
                        cliente_nome_fantasia,
                        tipo_visita,
                        vendedor_id_erp,
                        vendedor_nome,
                        atualizado_em
                    )
                    VALUES (
                        :id_visita_erp,
                        :data_hora_visita,
                        :id_cliente_erp,
                        :latitude,
                        :longitude,
                        :id_tipo_visita,
                        :id_vendedor_erp,
                        :observacao,
                        :cliente_nome,
                        :cliente_nome_fantasia,
                        :tipo_visita,
                        :vendedor_id_erp,
                        :vendedor_nome,
                        NOW()
                    )
                    ON CONFLICT (id_visita_erp)
                    DO UPDATE SET
                        data_hora_visita = EXCLUDED.data_hora_visita,
                        id_cliente_erp = EXCLUDED.id_cliente_erp,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude,
                        id_tipo_visita = EXCLUDED.id_tipo_visita,
                        id_vendedor_erp = EXCLUDED.id_vendedor_erp,
                        observacao = EXCLUDED.observacao,
                        cliente_nome = EXCLUDED.cliente_nome,
                        cliente_nome_fantasia = EXCLUDED.cliente_nome_fantasia,
                        tipo_visita = EXCLUDED.tipo_visita,
                        vendedor_id_erp = EXCLUDED.vendedor_id_erp,
                        vendedor_nome = EXCLUDED.vendedor_nome,
                        atualizado_em = NOW()
                """),
                row.to_dict(),
            )

    print(f"{len(df)} visitas sincronizadas com sucesso.")
    return len(df)


def main():
    inicio = datetime.now()
    registros = 0

    try:
        print("Testando conexão com ERP...")
        testar_conexao_erp()

        print("Buscando visitas no ERP...")
        df = buscar_visitas_erp()

        print(f"Registros encontrados: {len(df)}")

        print("Enviando para Neon...")
        registros = upsert_visitas_neon(df)

        fim = datetime.now()

        registrar_carga(
            inicio=inicio,
            fim=fim,
            registros=registros,
            status="SUCESSO",
            mensagem="Carga concluída com sucesso.",
        )

        print("Finalizado.")

    except Exception as e:
        fim = datetime.now()

        try:
            registrar_carga(
                inicio=inicio,
                fim=fim,
                registros=registros,
                status="ERRO",
                mensagem=str(e),
            )
        except Exception as erro_log:
            print("Erro ao registrar falha no controle_carga:", str(erro_log))

        print("Erro na execução do ETL:", str(e))
        raise


if __name__ == "__main__":
    main()