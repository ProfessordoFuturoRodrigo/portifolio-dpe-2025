document.addEventListener('DOMContentLoaded', () => {
    const listaProjetosDiv = document.getElementById('lista-projetos');
    const tipoProjeto = listaProjetosDiv.getAttribute('data-tipo'); // 'grupos' ou 'individuais'
    const arquivoDados = tipoProjeto === 'grupos' ? 'dados_grupos.txt' : 'dados_individuais.txt';

    const filtroTurmaSelect = document.getElementById('filtro-turma');
    const pesquisaInput = document.getElementById('pesquisa-aluno');
    
    let todosProjetos = [];
    let todasTurmas = new Set();

    // Função para carregar os dados
    async function carregarDados() {
        try {
            const response = await fetch(arquivoDados);
            if (!response.ok) {
                throw new Error(`Erro ao carregar o arquivo ${arquivoDados}`);
            }
            const data = await response.text();
            processarDados(data);
        } catch (error) {
            console.error(error);
            listaProjetosDiv.innerHTML = '<p class="sem-resultados">Erro ao carregar os dados dos projetos.</p>';
        }
    }

    // Função para processar o conteúdo do TXT
    function processarDados(data) {
        const linhas = data.split('\n').filter(line => line.trim() !== '');
        todosProjetos = linhas.map(linha => {
            const colunas = linha.split('|').map(c => c.trim());
            const turma = colunas[0];
            todasTurmas.add(turma);

            if (tipoProjeto === 'grupos') {
                // Estrutura de 'dados_grupos.txt': Turma|Projeto|Descrição|Link|Integrantes
                return {
                    turma,
                    titulo: colunas[1],
                    descricao: colunas[2],
                    link: colunas[3],
                    autores: colunas[4]
                };
            } else {
                // Estrutura de 'dados_individuais.txt': Turma|Nome do Aluno|Título|Link|Autor(es)
                return {
                    turma,
                    aluno: colunas[1],
                    titulo: colunas[2],
                    link: colunas[3],
                    autores: colunas[4] // Pode ser o mesmo que 'aluno' ou ter mais detalhes
                };
            }
        });

        preencherFiltroTurma();
        renderizarProjetos(todosProjetos);
    }

    // Função para preencher o <select> das turmas
    function preencherFiltroTurma() {
        // Limpa e adiciona a opção "Todas as Turmas"
        filtroTurmaSelect.innerHTML = '<option value="">Todas as Turmas</option>';
        
        // Ordena as turmas (ex: 1º A, 1º B, 2º A...)
        const turmasOrdenadas = Array.from(todasTurmas).sort((a, b) => {
            if (a.length !== b.length) return a.length - b.length;
            return a.localeCompare(b);
        });

        turmasOrdenadas.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma;
            option.textContent = turma;
            filtroTurmaSelect.appendChild(option);
        });
    }

    // Função para renderizar os cards de projeto
    function renderizarProjetos(projetos) {
        listaProjetosDiv.innerHTML = '';
        if (projetos.length === 0) {
            listaProjetosDiv.innerHTML = '<p class="sem-resultados">Nenhum projeto encontrado com os filtros e pesquisa atuais.</p>';
            return;
        }

        projetos.forEach(projeto => {
            // Verifica se o link é o placeholder '#Link' ou um link que indica construção
            const isEmConstrucao = !projeto.link || projeto.link === '#Link' || projeto.link.includes('em_constru-o') || projeto.link.includes('PROJETO ABANDONADO!');
            
            const card = document.createElement('div');
            card.classList.add('projeto-card');
            if (isEmConstrucao) {
                card.classList.add('projeto-em-construcao');
            }

            // Conteúdo do card
            let htmlConteudo = `
                <h3>${projeto.titulo}</h3>
                <p><strong>Turma:</strong> ${projeto.turma}</p>
            `;

            if (tipoProjeto === 'grupos') {
                htmlConteudo += `<p><strong>Descrição:</strong> ${projeto.descricao}</p>`;
                htmlConteudo += `<p><strong>Integrantes:</strong> ${projeto.autores}</p>`;
            } else {
                htmlConteudo += `<p><strong>Aluno:</strong> ${projeto.aluno}</p>`;
            }

            const linkTexto = isEmConstrucao ? 'Em Construção (Não Abrir)' : 'Acessar Projeto';
            const linkHref = isEmConstrucao ? '#' : projeto.link;
            const linkTarget = isEmConstrucao ? '' : '_blank'; // Abre em nova aba se não for 'Em Construção'
            
            htmlConteudo += `<a href="${linkHref}" target="${linkTarget}" ${isEmConstrucao ? 'onclick="event.preventDefault()"' : ''}>${linkTexto}</a>`;

            card.innerHTML = htmlConteudo;
            listaProjetosDiv.appendChild(card);
        });
    }

    // Função para filtrar e pesquisar
    function filtrarProjetos() {
        const turmaSelecionada = filtroTurmaSelect.value;
        const termoPesquisa = pesquisaInput.value.toLowerCase().trim();

        const projetosFiltrados = todosProjetos.filter(projeto => {
            const filtroTurma = !turmaSelecionada || projeto.turma === turmaSelecionada;
            
            let filtroPesquisa = true;
            if (termoPesquisa) {
                const buscaCampos = [projeto.titulo, projeto.turma];
                
                if (tipoProjeto === 'grupos') {
                    buscaCampos.push(projeto.descricao, projeto.autores);
                } else {
                    buscaCampos.push(projeto.aluno, projeto.autores);
                }

                filtroPesquisa = buscaCampos.some(campo => 
                    campo && campo.toLowerCase().includes(termoPesquisa)
                );
            }

            return filtroTurma && filtroPesquisa;
        });

        renderizarProjetos(projetosFiltrados);
    }

    // Adiciona os event listeners
    filtroTurmaSelect.addEventListener('change', filtrarProjetos);
    pesquisaInput.addEventListener('input', filtrarProjetos);

    // Inicia o carregamento dos dados
    carregarDados();
});