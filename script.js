const apiKeyInput = document.getElementById('apiKey')
const gameSelect = document.getElementById('gameSelect')
const questionInput = document.getElementById('questionInput')
const askButton = document.getElementById('askButton')
const aiResponse = document.getElementById('aiResponse')
const form = document.getElementById('form')
const clearKeyButton = document.getElementById('clearKeyButton')

// Carregar chave salva ao inicializar
const loadSavedApiKey = () => {
    const savedKey = localStorage.getItem('gemini_api_key')
    if (savedKey) {
        apiKeyInput.value = savedKey
    }
}

// Salvar chave quando o usuário digitar
const saveApiKey = (apiKey) => {
    if (apiKey && apiKey.trim() !== '') {
        localStorage.setItem('gemini_api_key', apiKey)
    }
}

// Limpar chave salva
const clearSavedApiKey = () => {
    localStorage.removeItem('gemini_api_key')
    apiKeyInput.value = ''
    apiKeyInput.focus()
}

// Carregar chave ao carregar a página
document.addEventListener('DOMContentLoaded', loadSavedApiKey)

// Adicionar evento do botão de limpeza
if (clearKeyButton) {
    clearKeyButton.addEventListener('click', clearSavedApiKey)
}

const markdownToHTML = (text) => {
    const converter = new showdown.Converter()
    return converter.makeHtml(text)
}

const getGameSpecificPrompt = (game, question) => {
    const gameConfig = {
        valorant: {
            name: "Valorant",
            example: "pergunta do usuário: Melhor build para Jett\nresposta: **Armas:**\n\n• Vandal/Phantom como rifle principal\n• Spectre para eco rounds\n\n**Habilidades:**\n\n• Priorize Updraft e Dash para mobilidade\n• Use smokes para rotações\n\n**Posicionamento:**\n\n• Entry fragger, entre primeiro nos sites"
        },
        lol: {
            name: "League of Legends",
            example: "pergunta do usuário: Melhor build rengar jungle\nresposta: A build mais atual é:\n\n**Itens:**\n\n• Youmuu's Ghostblade\n• Duskblade of Draktharr\n• Edge of Night\n\n**Runas:**\n\n• Eletrocutar\n• Impacto Súbito\n• Globos Oculares\n• Caçador Implacável"
        },
        cs: {
            name: "CS:GO/CS2",
            example: "pergunta do usuário: Melhor config para AK-47\nresposta: **Configurações:**\n\n• Sensibilidade: 1.5-2.5 (400 DPI)\n• Crosshair: cl_crosshairsize 2, cl_crosshairgap -1\n\n**Spray Pattern:**\n\n• Primeiros 10 tiros: puxe para baixo\n• Depois alterne esquerda/direita\n\n**Posicionamento:**\n\n• Mantenha distância média-longa\n• Use pre-aim nos ângulos"
        }
    }

    const config = gameConfig[game]
    if (!config) {
        return null
    }

    return `
    ## Especialidade
    Você é um especialista assistente de meta para o jogo ${config.name}

    ## Tarefa
    Você deve responder as perguntas do usuário com base no seu conhecimento do jogo, estratégias, build, configurações e dicas

    ## Regras
    - Se você não sabe a resposta, responda com 'Não sei' e não tente inventar uma resposta.
    - Se a pergunta não está relacionada ao jogo, responda com 'Essa pergunta não está relacionada ao jogo'
    - Considere a data atual ${new Date().toLocaleDateString()}
    - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente.
    - Nunca responda itens que você não tenha certeza de que existe no patch atual.
    - Para Valorant: foque em agentes, armas, mapas, estratégias de equipe e economia
    - Para CS:GO/CS2: foque em armas, configurações, granadas, posicionamento e táticas
    - Para League of Legends: foque em champions, itens, runas, jungle, lanes e meta

    ## Resposta
    - Economize na resposta, seja direto e responda no máximo 500 caracteres
    - Responda em markdown
    - Não precisa fazer nenhuma saudação ou despedida, apenas responda o que o usuário está querendo.

    ## Exemplo de resposta
    ${config.example}

    ---
    Aqui está a pergunta do usuário: ${question}
  `
}

const perguntarAI = async (question, game, apiKey) => {
    const model = "gemini-2.0-flash"
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    
    const pergunta = getGameSpecificPrompt(game, question)
    
    if (!pergunta) {
        throw new Error('Jogo não suportado')
    }

    const contents = [{
        role: "user",
        parts: [{
            text: pergunta
        }]
    }]

    const tools = [{
        google_search: {}
    }]

    // chamada API
    const response = await fetch(geminiURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents,
            tools
        })
    })

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
}

const enviarFormulario = async (event) => {
    event.preventDefault()
    const apiKey = apiKeyInput.value
    const game = gameSelect.value
    const question = questionInput.value

    if (apiKey == '' || game == '' || question == '') {
        alert('Por favor, preencha todos os campos')
        return
    }

    // Salvar a chave API quando for usada
    saveApiKey(apiKey)

    askButton.disabled = true
    askButton.textContent = 'Perguntando...'
    askButton.classList.add('loading')

    try {
        const text = await perguntarAI(question, game, apiKey)
        aiResponse.querySelector('.response-content').innerHTML = markdownToHTML(text)
        aiResponse.classList.remove('hidden')
    } catch (error) {
        console.log('Erro: ', error)
        alert('Erro ao processar a pergunta. Verifique sua API key e tente novamente.')
    } finally {
        askButton.disabled = false
        askButton.textContent = "Perguntar"
        askButton.classList.remove('loading')
    }
}

form.addEventListener('submit', enviarFormulario)