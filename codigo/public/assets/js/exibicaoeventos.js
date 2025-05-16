document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
});

async function loadEvents() {
    try {
        const response = await fetch('http://localhost:3000/eventos');
        const eventos = await response.json();
        
        const container = document.getElementById('cardseventos');
        container.innerHTML = '<h1 class="h1 text-center" id="pageHeaderTitle">PRÓXIMOS EVENTOS</h1>';

        eventos.forEach(evento => {
            const card = createEventCard(evento);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
    }
}

function createEventCard(evento) {
    const article = document.createElement('article');
    article.className = 'postcard orangebgcard red';
    article.onclick = () => navigateToEventDetails(evento.id);

    article.innerHTML = `
        <a class="postcard__img_link" href="#">
            <img class="postcard__img" src="${evento.imagem || 'https://picsum.photos/501/500'}" alt="${evento.titulo}" />    
        </a>
        <div class="postcard__text">
            <h1 class="postcard__title red"><a href="#">${evento.titulo}</a></h1>
            <div class="postcard__subtitle small">
                <time datetime="${evento.data}">
                    <i class="fas fa-calendar-alt mr-2"></i>${new Date(evento.data).toLocaleDateString('pt-BR')}
                </time>
            </div>
            <div class="postcard__bar"></div>
            <div class="postcard__preview-txt">${evento.descricao}</div>
            <ul class="postcard__tagbox">
                <li class="tag__item"><i class="fas fa-tag mr-2"></i><span class="me-2"></span>${evento.categoria}</li>
                <li class="tag__item"><i class="fas fa-map-marker-alt mr-2"></i><span class="me-2"></span${evento.local}</li>
                <li class="tag__item play red">
                    <a href="#"><i class="fas fa-info-circle mr-2"></i><span class="me-2"></span>Ver Detalhes</a>
                </li>
            </ul>
        </div>
    `;

    return article;
}

function navigateToEventDetails(eventoId) {
    window.location.href = `detalhesevento.html?id=${eventoId}`;
}