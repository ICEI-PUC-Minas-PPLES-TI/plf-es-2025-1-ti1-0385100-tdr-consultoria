document.addEventListener('DOMContentLoaded', function () {
    const API_URL = '';
    let usuarioLogado = null;
    let notaSelecionada = 0;

    // Função para obter o usuário logado
    function getUsuarioLogado() {
        try {
            const usuarioLogadoJSON = localStorage.getItem('usuarioLogado');
            if (!usuarioLogadoJSON) {
                console.log('Nenhum usuário logado encontrado no localStorage');
                return null;
            }
            const usuario = JSON.parse(usuarioLogadoJSON);
            console.log('Usuário logado:', usuario);
            return usuario;
        } catch (error) {
            console.error('Erro ao obter usuário logado:', error);
            return null;
        }
    }

    // Pega o ID do evento pela query string (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('id');

    // Exibe o formulário de avaliação só se houver eventoId e usuário logado
    const avaliacaoContainer = document.getElementById('avaliacao-container');
    usuarioLogado = getUsuarioLogado();

    if (!eventoId) {
        avaliacaoContainer.innerHTML = "<div class='alert alert-danger'>Evento não identificado.</div>";
        return;
    }

    if (!usuarioLogado) {
        avaliacaoContainer.innerHTML = "<div class='alert alert-warning'>Você precisa estar logado para avaliar este evento. <a href='../login/loginregistro.html'>Faça login aqui</a>.</div>";
        return;
    }

    // Lógica das estrelas
    document.querySelectorAll('#estrelas .estrela').forEach(estrela => {
        estrela.addEventListener('click', () => {
            notaSelecionada = parseInt(estrela.dataset.value);
            document.querySelectorAll('#estrelas .estrela').forEach(e => e.classList.remove('selecionada'));
            for (let i = 0; i < notaSelecionada; i++) {
                document.querySelectorAll('#estrelas .estrela')[i].classList.add('selecionada');
            }
        });
    });

    // Função para enviar avaliação
    async function enviarAvaliacao() {
        try {
            const comentario = document.getElementById('comentario').value.trim();

            if (notaSelecionada === 0 || comentario === '') {
                alert("Por favor, selecione uma nota e escreva um comentário.");
                return;
            }

            // Verifica novamente se o usuário está logado
            const usuarioAtual = getUsuarioLogado();
            if (!usuarioAtual || !usuarioAtual.nome) {
                alert("Você precisa estar logado para enviar uma avaliação.");
                window.location.href = '../login/loginregistro.html';
                return;
            }            const avaliacao = {
                idevento: parseInt(eventoId),
                nome: usuarioAtual.nome,
                rating: notaSelecionada, // Alterado de nota para rating para manter consistência
                comentario: comentario,
                data: new Date().toISOString()
            };

            console.log('Enviando avaliação:', avaliacao);

            const response = await fetch(`${API_URL}/avaliacoeseventos`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(avaliacao)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Just clear form and reload evaluations
            document.getElementById('comentario').value = '';
            notaSelecionada = 0;
            document.querySelectorAll('#estrelas .estrela').forEach(e => e.classList.remove('selecionada'));
            await carregarAvaliacoes();
            
        } catch (error) {
            console.error('Erro ao enviar avaliação:', error);
            alert("Erro ao enviar avaliação. Por favor, tente novamente." + error.message);
        }
    }

    // Função para carregar avaliações
    async function carregarAvaliacoes() {
        try {
            const response = await fetch(`${API_URL}/avaliacoeseventos?idevento=${eventoId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const avaliacoes = await response.json();
            const lista = document.getElementById('avaliacoes-lista');
            
            if (!avaliacoes || avaliacoes.length === 0) {
                lista.innerHTML = "<p class='text-muted'>Nenhuma avaliação ainda.</p>";
                return;
            }

            lista.innerHTML = '<h3 class="mb-4">Avaliações do evento</h3>' + avaliacoes.map(av => `
                <div class="card mb-3">
                    <div class="card-body text-white">
                        <div>
                            <span style="color:gold">${'★'.repeat(av.rating)}${'☆'.repeat(5-av.rating)}</span>
                            <span>(${av.rating}.0)</span>
                        </div>
                        <strong>${av.nome}</strong>
                        <p class="mb-0">${av.comentario}</p>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
            document.getElementById('avaliacoes-lista').innerHTML = 
                `<div class='alert alert-danger'>Erro ao carregar avaliações: ${error.message}</div>`;
        }
    }

    // Função para excluir avaliação
    async function excluirAvaliacao(id) {
        if (!confirm("Tem certeza que deseja excluir este comentário?")) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/avaliacoeseventos/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert("Avaliação excluída com sucesso!");
            await carregarAvaliacoes();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert("Erro ao excluir avaliação: " + error.message);
        }
    }

    // Função para editar avaliação
    async function editarAvaliacao(id) {
        try {
            const response = await fetch(`${API_URL}/avaliacoeseventos/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const av = await response.json();            document.getElementById('comentario').value = av.comentario;
            notaSelecionada = av.rating;
            document.querySelectorAll('#estrelas .estrela').forEach(e => e.classList.remove('selecionada'));
            for (let i = 0; i < av.rating; i++) {
                document.querySelectorAll('#estrelas .estrela')[i].classList.add('selecionada');
            }

            const btn = document.getElementById('enviar-avaliacao');
            const originalText = btn.textContent;
            btn.textContent = "Salvar Alteração";

            const originalOnClick = btn.onclick;
            btn.onclick = async function() {
                try {
                    const comentario = document.getElementById('comentario').value.trim();
                    if (notaSelecionada === 0 || comentario === '') {
                        alert("Por favor, selecione uma nota e escreva um comentário.");
                        return;
                    }

                    const avaliacaoEditada = {
                        ...av,
                        rating: notaSelecionada,
                        comentario: comentario,
                        data: new Date().toISOString()
                    };

                    const updateResponse = await fetch(`${API_URL}/avaliacoeseventos/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(avaliacaoEditada)
                    });

                    if (!updateResponse.ok) {
                        throw new Error(`HTTP error! status: ${updateResponse.status}`);
                    }

                    alert("Avaliação atualizada com sucesso!");
                    btn.textContent = originalText;
                    btn.onclick = originalOnClick;
                    document.getElementById('comentario').value = '';
                    notaSelecionada = 0;
                    document.querySelectorAll('#estrelas .estrela').forEach(e => e.classList.remove('selecionada'));
                    await carregarAvaliacoes();
                } catch (error) {
                    console.error('Erro ao atualizar:', error);
                    alert("Erro ao atualizar avaliação: " + error.message);
                }
            };
        } catch (error) {
            console.error('Erro ao carregar avaliação para edição:', error);
            alert("Erro ao carregar avaliação para edição: " + error.message);
        }
    }

    // Inicializa o botão e carrega as avaliações
    const btn = document.getElementById('enviar-avaliacao');
    if (btn) {
        btn.onclick = enviarAvaliacao;
    }

    // Carrega as avaliações existentes
    carregarAvaliacoes();
});

