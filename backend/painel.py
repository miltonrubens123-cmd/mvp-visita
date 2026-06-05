import requests
import pandas as pd
import streamlit as st
import plotly.express as px
import folium

from streamlit_folium import st_folium
from streamlit_option_menu import option_menu


API_URL = "http://localhost:8000"


st.set_page_config(
    page_title="Monitoramento de Visitas",
    layout="wide"
)


st.markdown("""
<style>
.block-container {
    padding-top: 1.2rem;
}
</style>
""", unsafe_allow_html=True)


def get_api(endpoint):
    try:
        response = requests.get(f"{API_URL}{endpoint}", timeout=20)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Erro ao carregar {endpoint}: {e}")
        return []


def carregar_dataframe(endpoint):
    dados = get_api(endpoint)
    return pd.DataFrame(dados)


st.title("Monitoramento de Visitas")

menu = option_menu(
    menu_title=None,
    options=[
        "Monitoramento",
        "Ranking",
        "Analítico",
        "Programação"
    ],
    icons=[
        "map",
        "trophy",
        "table",
        "calendar-check"
    ],
    default_index=0,
    orientation="horizontal",
    styles={
        "container": {
            "padding": "0!important",
            "background-color": "#f8f9fa",
            "justify-content": "flex-end"
        },
        "nav-link": {
            "font-size": "14px",
            "text-align": "center",
            "margin": "0px"
        },
        "nav-link-selected": {
            "background-color": "#0d6efd"
        },
    }
)


df_visitas = carregar_dataframe("/visitas")
df_ranking = carregar_dataframe("/ranking")
df_tipos = carregar_dataframe("/tipos-visita")
df_mapa = carregar_dataframe("/mapa-visitas")


if not df_visitas.empty and "data_hora_visita" in df_visitas.columns:
    df_visitas["data_hora_visita"] = pd.to_datetime(df_visitas["data_hora_visita"])
    df_visitas["data_visita"] = df_visitas["data_hora_visita"].dt.date


if not df_mapa.empty and "data_hora_visita" in df_mapa.columns:
    df_mapa["data_hora_visita"] = pd.to_datetime(df_mapa["data_hora_visita"])
    df_mapa["data_visita"] = df_mapa["data_hora_visita"].dt.date


if menu == "Monitoramento":
    st.subheader("Monitoramento Diário")

    if df_visitas.empty:
        st.warning("Nenhuma visita encontrada.")
    else:
        col1, col2, col3, col4 = st.columns(4)

        col1.metric("Visitas", len(df_visitas))
        col2.metric("Vendedores", df_visitas["vendedor_nome"].nunique())
        col3.metric("Clientes", df_visitas["cliente_nome_fantasia"].nunique())
        col4.metric("Vendas Efetivadas", int(df_visitas["venda_efetivada"].sum()))

        st.divider()

        col_f1, col_f2, col_f3 = st.columns(3)

        datas = sorted(df_visitas["data_visita"].dropna().unique().tolist())

        with col_f1:
            data_selecionada = st.selectbox(
                "Data",
                datas,
                index=len(datas) - 1 if datas else 0
            )

        with col_f2:
            vendedores = ["Todos"] + sorted(df_visitas["vendedor_nome"].dropna().unique().tolist())
            vendedor_selecionado = st.selectbox("Vendedor", vendedores)

        with col_f3:
            tipos = ["Todos"] + sorted(df_visitas["tipo_visita"].dropna().unique().tolist())
            tipo_selecionado = st.selectbox("Tipo de visita", tipos)

        df_filtrado = df_visitas[df_visitas["data_visita"] == data_selecionada].copy()

        if vendedor_selecionado != "Todos":
            df_filtrado = df_filtrado[df_filtrado["vendedor_nome"] == vendedor_selecionado]

        if tipo_selecionado != "Todos":
            df_filtrado = df_filtrado[df_filtrado["tipo_visita"] == tipo_selecionado]

        col_grafico, col_mapa = st.columns([1, 2])

        with col_grafico:
            st.markdown("#### Visitas por Vendedor")

            if df_filtrado.empty:
                st.info("Sem dados para os filtros selecionados.")
            else:
                df_grafico = (
                    df_filtrado
                    .groupby("vendedor_nome")
                    .size()
                    .reset_index(name="visitas")
                    .sort_values("visitas", ascending=False)
                )

                fig = px.bar(
                    df_grafico,
                    x="vendedor_nome",
                    y="visitas",
                    text="visitas"
                )

                st.plotly_chart(fig, use_container_width=True)

        with col_mapa:
            st.markdown("#### Mapa de Visitas")

            df_mapa_filtrado = df_mapa.copy()

            if not df_mapa_filtrado.empty:
                df_mapa_filtrado = df_mapa_filtrado[df_mapa_filtrado["data_visita"] == data_selecionada]

                if vendedor_selecionado != "Todos":
                    df_mapa_filtrado = df_mapa_filtrado[df_mapa_filtrado["vendedor_nome"] == vendedor_selecionado]

                if tipo_selecionado != "Todos":
                    df_mapa_filtrado = df_mapa_filtrado[df_mapa_filtrado["tipo_visita"] == tipo_selecionado]

                df_mapa_filtrado = df_mapa_filtrado.sort_values("id_visita_erp")

            if df_mapa_filtrado.empty:
                st.info("Nenhuma visita com geolocalização para os filtros selecionados.")
            else:
                centro_lat = df_mapa_filtrado["latitude"].mean()
                centro_lon = df_mapa_filtrado["longitude"].mean()

                mapa = folium.Map(
                    location=[centro_lat, centro_lon],
                    zoom_start=12
                )

                cores = [
                    "red", "blue", "green", "purple", "orange",
                    "darkred", "darkblue", "darkgreen", "cadetblue",
                    "darkpurple", "pink", "lightblue", "lightgreen",
                    "gray", "black"
                ]

                vendedores_unicos = df_mapa_filtrado["vendedor_nome"].dropna().unique().tolist()

                mapa_cores = {
                    vendedor: cores[i % len(cores)]
                    for i, vendedor in enumerate(vendedores_unicos)
                }

                for vendedor, grupo in df_mapa_filtrado.groupby("vendedor_nome"):
                    grupo = grupo.sort_values("id_visita_erp")
                    pontos_rota = grupo[["latitude", "longitude"]].values.tolist()
                    cor = mapa_cores.get(vendedor, "blue")

                    if len(pontos_rota) > 1:
                        folium.PolyLine(
                            pontos_rota,
                            color=cor,
                            weight=4,
                            opacity=0.7,
                            tooltip=f"Rota - {vendedor}"
                        ).add_to(mapa)

                    for _, row in grupo.iterrows():
                        folium.Marker(
                            location=[row["latitude"], row["longitude"]],
                            popup=f"""
                            <b>Visita:</b> {row["id_visita_erp"]}<br>
                            <b>Vendedor:</b> {row["vendedor_nome"]}<br>
                            <b>Cliente:</b> {row["cliente_nome_fantasia"]}<br>
                            <b>Tipo:</b> {row["tipo_visita"]}<br>
                            <b>Data/Hora:</b> {row["data_hora_visita"]}
                            """,
                            tooltip=f'{row["id_visita_erp"]} - {row["cliente_nome_fantasia"]}',
                            icon=folium.Icon(color=cor, icon="info-sign")
                        ).add_to(mapa)

                st_folium(mapa, width=None, height=620)


elif menu == "Ranking":
    st.subheader("Ranking de Vendedores")

    if df_ranking.empty:
        st.warning("Nenhum ranking encontrado.")
    else:
        total_visitas = int(df_ranking["visitas"].sum())
        total_vendedores = df_ranking["vendedor_nome"].nunique()
        total_vendas_efetivadas = int(df_ranking["vendas_efetivadas"].sum())

        col1, col2, col3 = st.columns(3)

        col1.metric("Total de Visitas", total_visitas)
        col2.metric("Vendedores", total_vendedores)
        col3.metric("Vendas Efetivadas", total_vendas_efetivadas)

        st.divider()

        col1, col2 = st.columns([1.3, 1])

        with col1:
            fig = px.bar(
                df_ranking,
                x="vendedor_nome",
                y="visitas",
                text="visitas",
                title="Visitas por Vendedor"
            )
            st.plotly_chart(fig, use_container_width=True)

        with col2:
            st.dataframe(df_ranking, use_container_width=True)


elif menu == "Analítico":
    st.subheader("Relatórios Analíticos")

    if df_visitas.empty:
        st.warning("Nenhuma visita encontrada.")
    else:
        col_f1, col_f2, col_f3 = st.columns(3)

        datas = sorted(df_visitas["data_visita"].dropna().unique().tolist())

        with col_f1:
            data_inicio = st.date_input("Data inicial", value=min(datas))

        with col_f2:
            data_fim = st.date_input("Data final", value=max(datas))

        with col_f3:
            vendedor_opcoes = ["Todos"] + sorted(df_visitas["vendedor_nome"].dropna().unique().tolist())
            vendedor = st.selectbox("Vendedor", vendedor_opcoes, key="analitico_vendedor")

        df_analitico = df_visitas[
            (df_visitas["data_visita"] >= data_inicio) &
            (df_visitas["data_visita"] <= data_fim)
        ].copy()

        if vendedor != "Todos":
            df_analitico = df_analitico[df_analitico["vendedor_nome"] == vendedor]

        col1, col2 = st.columns([2, 1])

        with col1:
            st.markdown("#### Últimas Visitas")
            st.dataframe(
                df_analitico[
                    [
                        "id_visita_erp",
                        "data_hora_visita",
                        "vendedor_nome",
                        "cliente_nome_fantasia",
                        "tipo_visita",
                        "latitude",
                        "longitude"
                    ]
                ].sort_values("data_hora_visita", ascending=False),
                use_container_width=True
            )

        with col2:
            st.markdown("#### Tipos de Visita")

            if df_tipos.empty:
                st.info("Sem tipos de visita.")
            else:
                fig = px.pie(
                    df_tipos,
                    names="tipo_visita",
                    values="qtd"
                )
                st.plotly_chart(fig, use_container_width=True)
                st.dataframe(df_tipos, use_container_width=True)


elif menu == "Programação":
    st.subheader("Cadastro de Programação de Visitas")

    st.info("Nesta etapa vamos cadastrar as pastas de visita e depois vincular clientes às pastas.")

    aba1, aba2 = st.tabs(["Pastas", "Clientes da Programação"])

    with aba1:
        st.markdown("#### Cadastro de Pastas")

        with st.form("form_pasta"):
            nome_pasta = st.text_input("Nome da pasta", placeholder="Ex: Segunda Santarém / Rota Interior")
            dia_semana_nome = st.selectbox(
                "Dia da semana",
                [
                    "Segunda-feira",
                    "Terça-feira",
                    "Quarta-feira",
                    "Quinta-feira",
                    "Sexta-feira",
                    "Sábado",
                    "Domingo"
                ]
            )

            frequencia = st.selectbox(
                "Frequência",
                [
                    "Semanal",
                    "Quinzenal",
                    "Mensal",
                    "Sazonal"
                ]
            )

            data_inicio = st.date_input("Data de início")
            ativo = st.checkbox("Ativo", value=True)

            salvar_pasta = st.form_submit_button("Salvar pasta")

            if salvar_pasta:
                st.warning("Endpoint de cadastro de pasta ainda será conectado na API.")

                st.write({
                    "nome": nome_pasta,
                    "dia_semana": dia_semana_nome,
                    "frequencia": frequencia,
                    "data_inicio": str(data_inicio),
                    "ativo": ativo
                })

    with aba2:
        st.markdown("#### Vincular Cliente à Programação")

        clientes = carregar_dataframe("/clientes")
        vendedores = carregar_dataframe("/vendedores")

        if clientes.empty or vendedores.empty:
            st.warning("Clientes ou vendedores não encontrados.")
        else:
            with st.form("form_programacao_cliente"):
                cliente_opcao = st.selectbox(
                    "Cliente",
                    clientes["razao_social"].tolist()
                    if "razao_social" in clientes.columns
                    else clientes.iloc[:, 0].astype(str).tolist()
                )

                vendedor_opcao = st.selectbox(
                    "Vendedor",
                    vendedores["nome"].tolist()
                    if "nome" in vendedores.columns
                    else vendedores.iloc[:, 0].astype(str).tolist()
                )

                pasta_opcao = st.text_input(
                    "Pasta",
                    placeholder="Enquanto o endpoint não existe, informe manualmente o nome da pasta"
                )

                ordem_rota = st.number_input("Ordem da rota", min_value=1, step=1)
                ativo_cliente = st.checkbox("Cliente ativo na programação", value=True)

                salvar_cliente = st.form_submit_button("Salvar programação")

                if salvar_cliente:
                    st.warning("Endpoint de vínculo de cliente ainda será conectado na API.")

                    st.write({
                        "cliente": cliente_opcao,
                        "vendedor": vendedor_opcao,
                        "pasta": pasta_opcao,
                        "ordem_rota": ordem_rota,
                        "ativo": ativo_cliente
                    })