const API_URL = '';
const UPLOAD_URL = `${API_URL}/upload-noticia`;

document.addEventListener('DOMContentLoaded', () => {
    loadNews();
    document.getElementById('form-cadastro').addEventListener('submit', handleSubmit);
});

async function loadNews() {
    try {
        const response = await fetch(`${API_URL}/noticias`);
        const noticias = await response.json();

        const tableBody = document.getElementById('newsTable');
        tableBody.innerHTML = noticias.map(noticia => `
            <tr>
                <td>${noticia.titulo}</td>
                <td>${noticia.categoria}</td>
                <td>${noticia.autor || 'Anônimo'}</td>
                <td class="text-center">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-primary" onclick="editNews('${noticia.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger ms-2" onclick="deleteNews('${noticia.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
    }
}

async function handleSubmit(event) {
    event.preventDefault();

    try {
        const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuario) throw new Error('Usuário não está logado');

        const id = document.getElementById('noticiaId').value || Date.now().toString();
        const titulo = document.getElementById('titulo').value;
        const descricao_breve = document.getElementById('descricao_breve').value;
        const texto_completo = document.getElementById('texto_completo').value;
        const categoria = document.getElementById('categoria').value;
        const imagemInput = document.getElementById('imagem');
        const imagemAtual = imagemInput.getAttribute('data-current') || '';

        let imagemFinal = imagemAtual;

        if (imagemInput.files && imagemInput.files[0]) {
            const uploadedUrl = await uploadImagemNoticia(imagemInput.files[0]);
            if (!uploadedUrl) {
                alert('Falha no upload da imagem. Notícia não será salva.');
                return;
            }
            imagemFinal = uploadedUrl;
        }

        const noticiaData = {
            id,
            titulo,
            descricao_breve,
            texto_completo,
            categoria,
            imagem: imagemFinal,
            data: new Date().toISOString(),
            autor: usuario.nome,
            autorId: usuario.id
        };

        const isEditing = document.getElementById('noticiaId').value !== '';
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_URL}/noticias/${id}` : `${API_URL}/noticias`;

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noticiaData)
        });

        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        // Clear form and reload news without showing success message
        document.getElementById('form-cadastro').reset();
        document.getElementById('noticiaId').value = '';
        document.getElementById('imagem-info').textContent = '';
        loadNews();
        
    } catch (error) {
        console.error('Erro:', error);
        // Keep error alert with SweetAlert
        await Swal.fire({
            title: 'Erro!',
            text: 'Erro ao salvar notícia: ' + error.message,
            icon: 'error',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal-custom-button'
            }
        });
    }
}

async function editNews(id) {
    try {
        const response = await fetch(`${API_URL}/noticias/${id}`);
        const noticia = await response.json();

        document.getElementById('noticiaId').value = noticia.id;
        document.getElementById('titulo').value = noticia.titulo;
        document.getElementById('descricao_breve').value = noticia.descricao_breve;
        document.getElementById('texto_completo').value = noticia.texto_completo;
        document.getElementById('categoria').value = noticia.categoria;

        const imagemInput = document.getElementById('imagem');
        imagemInput.value = '';
        imagemInput.setAttribute('data-current', noticia.imagem || '');

        mostrarImagemAtual(noticia.imagem);
    } catch (error) {
        console.error('Erro ao carregar notícia:', error);
        alert('Erro ao carregar notícia para edição');
    }
}

async function deleteNews(id) {
    try {
        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Confirmar exclusão?',
            text: 'Esta ação não pode ser desfeita!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal-custom-button',
                cancelButton: 'swal-custom-button'
            }
        });

        // If user confirmed
        if (result.isConfirmed) {
            const response = await fetch(`${API_URL}/noticias/${id}`, { 
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            // Reload news list after successful deletion
            await loadNews();
        }
    } catch (error) {
        console.error('Erro:', error);
        // Show error message if deletion fails
        await Swal.fire({
            title: 'Erro!',
            text: 'Não foi possível excluir a notícia.',
            icon: 'error',
            customClass: {
                popup: 'swal2-popup',
                confirmButton: 'swal-custom-button'
            }
        });
    }
}

function mostrarImagemAtual(url) {
    const info = document.getElementById('imagem-info');
    if (url) {
        const nomeArquivo = url.split('/').pop();
        info.textContent = `Imagem atual: ${nomeArquivo}`;
        info.style.display = 'block';
    } else {
        info.textContent = '';
        info.style.display = 'none';
    }
}

async function uploadImagemNoticia(file) {
    const formData = new FormData();
    formData.append('imagem', file);

    try {
        const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`Erro no upload da imagem: ${response.status}`);

        const data = await response.json();
        return data.imageUrl;
    } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        return '';
    }
}
