
extends Control

# IMAGENS DOS CINCO ESTADOS DO SUPERMERCADO
const CLEANING_BACKGROUNDS: Array[String] = [
	"res://art/backgrounds/dirty_store.png",
	"res://art/backgrounds/dirty_store_floor_clean.png",
	"res://art/backgrounds/dirty_store_floor_cashier_clean.png",
	"res://art/backgrounds/dirty_store_floor_cashier_shelves_clean.png",
    "res://art/backgrounds/mercado_limpo.jpg"
]

# ORDEM OBRIGATÓRIA DA LIMPEZA
const CLEANING_ORDER: Array[String] = [
	"floor",
	"cashier",
	"shelves",
    "ceiling"
]

const CLEANING_NAMES: Array[String] = [
	"o chão",
	"o caixa",
	"as prateleiras",
    "o teto"
]

# DIÁLOGOS DO LUÍS
const DIALOGUES: Array[Dictionary] = [

	{
		"text": "Belo, está muito sujo e cheio de pó, parece que um apocalipse passou por aqui!",
		"sprite": "res://art/characters/luis/luis_explicando.png",
		"scale": 1.0
	},

	{
		"text": "Já sei! Como sua primeira tarefa do dia, vamos limpar esse local!",
		"sprite": "res://art/characters/luis/luis_joinha.png",
		"scale": 1.0
	},

	{
		"text": "Clique nas bolinhas vermelhas em ordem crescente e cumpra as funções necessárias. A sequência é: chão, caixa, prateleiras e teto.",
		"sprite": "res://art/characters/luis/luis_explicando.png",
		"scale": 0.60
	}
]


# CONTROLE DA PROGRESSÃO
var dialogue_index: int = 0
var current_clean_step: int = 0

var is_typing: bool = false
var is_transitioning: bool = false

var dialogue_mode: String = "cleaning_tutorial"

var after_clean_index: int = 0
var day_end_index: int = 0

# REFERÊNCIAS DOS NODES
@onready var background: TextureRect = $Background
@onready var luis: TextureRect = $Luis

@onready var dialogue_panel: PanelContainer = $DialoguePanel
@onready var character_name: Label = $DialoguePanel/VBoxContainer/CharacterName
@onready var dialogue_text: Label = $DialoguePanel/VBoxContainer/DialogueText
@onready var next_button: Button = $DialoguePanel/VBoxContainer/ButtonRow/NextButton

@onready var floor_button: TextureButton = $CleaningButtons/FloorButton
@onready var cashier_button: TextureButton = $CleaningButtons/CashierButton
@onready var shelves_button: TextureButton = $CleaningButtons/ShelvesButton
@onready var ceiling_button: TextureButton = $CleaningButtons/CeilingButton

@onready var feedback_label: Label = $FeedbackLabel

@onready var money_panel: TextureRect = $MoneyPanel
@onready var day_panel: TextureRect = $DayPanel

@onready var money_label: Label = $MoneyPanel/MoneyLabel
@onready var day_label: Label = $DayPanel/DayLabel

@onready var typewriter_timer: Timer = $TypewriterTimer
@onready var feedback_timer: Timer = $FeedbackTimer

@onready var cart_button: TextureButton = $CartButton
@onready var offer_tooltip: TextureRect = $OfferTooltip

func _ready() -> void:

	# Configura os fundos e elementos visuais.
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE

	luis.mouse_filter = Control.MOUSE_FILTER_IGNORE
	luis.z_index = 10

	# Valores iniciais da interface.
	money_label.text = "R$ 300,00"
	day_label.text = "01"

	# Configura os temporizadores.
	typewriter_timer.wait_time = 0.035
	typewriter_timer.one_shot = false

	feedback_timer.one_shot = true
	feedback_timer.wait_time = 2.0

	# Conecta os botões.
	next_button.pressed.connect(_on_next_pressed)

	floor_button.pressed.connect(_on_floor_pressed)
	cashier_button.pressed.connect(_on_cashier_pressed)
	shelves_button.pressed.connect(_on_shelves_pressed)
	ceiling_button.pressed.connect(_on_ceiling_pressed)
	
	ceiling_button.visible = true
	ceiling_button.disabled = false
	ceiling_button.mouse_filter = Control.MOUSE_FILTER_STOP
	ceiling_button.z_index = 25
	ceiling_button.ignore_texture_size = true
	ceiling_button.stretch_mode = TextureButton.STRETCH_SCALE
	ceiling_button.custom_minimum_size = Vector2(42, 42)

	typewriter_timer.timeout.connect(_on_typewriter_timeout)
	feedback_timer.timeout.connect(_on_feedback_timeout)

	# Esconde os pontos até o tutorial terminar.
	_hide_cleaning_buttons()

	feedback_label.hide()

	# Mostra a primeira fala.
	_show_dialogue()
	
	_configure_luis_layout()
	_configure_dialogue_layout()
	_configure_continue_button()

	_configure_hud_layout()
	_configure_hud_labels()

	cart_button.pressed.connect(_on_cart_pressed)

	cart_button.mouse_entered.connect(_on_cart_mouse_entered)
	cart_button.mouse_exited.connect(_on_cart_mouse_exited)

	cart_button.hide()
	offer_tooltip.hide()
# -------------------------------------
# DIÁLOGOS DO LUÍS
# -------------------------------------

func _show_dialogue() -> void:

	var dialogue: Dictionary = DIALOGUES[dialogue_index]

	var sprite_path: String = dialogue["sprite"]

	if ResourceLoader.exists(sprite_path):
		luis.texture = load(sprite_path) as Texture2D
	else:
		push_error("Sprite não encontrado: " + sprite_path)

	character_name.text = "Luís"
	dialogue_text.text = dialogue["text"]

	dialogue_text.visible_characters = 0

	dialogue_panel.show()

	next_button.show()
	next_button.text = "Continuar  ›"

	is_typing = true
	typewriter_timer.start()


func _on_typewriter_timeout() -> void:

	if dialogue_text.visible_characters < dialogue_text.text.length():
		dialogue_text.visible_characters += 1
	else:
		typewriter_timer.stop()
		is_typing = false



func _on_next_pressed() -> void:

	# Se ainda estiver digitando, completa a fala.
	if is_typing:

		typewriter_timer.stop()
		dialogue_text.visible_characters = -1
		is_typing = false

		return


	# FASE 1 — Tutorial da limpeza.
	if dialogue_mode == "cleaning_tutorial":

		dialogue_index += 1

		if dialogue_index < DIALOGUES.size():
			_show_dialogue()
		else:
			dialogue_panel.hide()
			luis.hide()
			_show_cleaning_buttons()

			return


	# FASE 2 — Instruções da compra

	if dialogue_mode == "after_clean":

		after_clean_index += 1

		if after_clean_index < AFTER_CLEAN_DIALOGUES.size():

			_show_after_clean_dialogue()

		else:

			dialogue_panel.hide()
			luis.hide()

			# O carrinho aparece depois das explicações.
			cart_button.show()

		return


	# FASE 3 — Encerramento do Dia 1.
	if dialogue_mode == "day_end":

		day_end_index += 1

		if day_end_index < DAY_END_DIALOGUES.size():

			_show_day_end_dialogue()

		else:

			dialogue_panel.hide()
			luis.hide()

			GameState.complete_day_1()

			await SceneTransition.change_scene(
                "res://scenes/story/level_2_unlocked.tscn"
			)

		return



# -------------------------------------
# EXIBIR OS BOTÕES DE LIMPEZA
# -------------------------------------

func _show_cleaning_buttons() -> void:

	floor_button.show()
	cashier_button.show()
	shelves_button.show()
	ceiling_button.show()


func _hide_cleaning_buttons() -> void:

	floor_button.hide()
	cashier_button.hide()
	shelves_button.hide()
	ceiling_button.hide()


func _disable_cleaning_buttons(value: bool) -> void:

	floor_button.disabled = value
	cashier_button.disabled = value
	shelves_button.disabled = value
	ceiling_button.disabled = value


# -------------------------------------
# CLIQUES DOS QUATRO PONTOS
# -------------------------------------

func _on_floor_pressed() -> void:
	await _try_clean("floor", floor_button)


func _on_cashier_pressed() -> void:
	await _try_clean("cashier", cashier_button)


func _on_shelves_pressed() -> void:
	await _try_clean("shelves", shelves_button)


func _on_ceiling_pressed() -> void:
	await _try_clean("ceiling", ceiling_button)


# -------------------------------------
# VALIDAR E EXECUTAR A LIMPEZA
# -------------------------------------

func _try_clean(area: String, clicked_button: TextureButton) -> void:

	if is_transitioning:
		return

	if current_clean_step >= CLEANING_ORDER.size():
		return

	# Descobre qual local deve ser limpo agora.
	var expected_area: String = CLEANING_ORDER[current_clean_step]

	# Verifica se o jogador clicou na ordem correta.
	if area != expected_area:

		_show_feedback(
			"Ainda não, Belo! Primeiro, limpe " +
			CLEANING_NAMES[current_clean_step] + "."
		)

		return

	# Carrega antecipadamente a próxima imagem.
	var next_background_path: String = CLEANING_BACKGROUNDS[
		current_clean_step + 1
	]

	if not ResourceLoader.exists(next_background_path):
		push_error("Imagem da próxima limpeza não encontrada: " + next_background_path)
		return

	var next_texture := load(next_background_path) as Texture2D

	if next_texture == null:
		push_error("Não foi possível carregar a próxima imagem.")
		return

	is_transitioning = true

	_disable_cleaning_buttons(true)

	# Escurece a tela.
	await SceneTransition.fade_to_black()

	# Atualiza o cenário.
	background.texture = next_texture

	# Avança a progressão.
	current_clean_step += 1

	# Remove o marcador da área que acabou de ser limpa.
	clicked_button.hide()

	# Revela novamente o cenário.
	await SceneTransition.fade_from_black()

	_disable_cleaning_buttons(false)

	is_transitioning = false

	# Verifica se todas as tarefas foram concluídas.
	if current_clean_step >= CLEANING_ORDER.size():

		_finish_cleaning()

	else:

		_show_feedback(
			"Muito bem! Agora limpe " +
			CLEANING_NAMES[current_clean_step] + "."
		)


# -------------------------------------
# AVISOS NA TELA
# -------------------------------------

func _show_feedback(message: String) -> void:

	feedback_label.text = message
	feedback_label.show()

	feedback_timer.start()


func _on_feedback_timeout() -> void:

	feedback_label.hide()


# -------------------------------------
# TAREFA FINALIZADA
# -------------------------------------

func _finish_cleaning() -> void:

	_hide_cleaning_buttons()

	feedback_label.hide()

	GameState.day_1_cleaning_completed = true

	dialogue_mode = "after_clean"
	after_clean_index = 0

	luis.show()

	_show_after_clean_dialogue()
		

func _configure_luis_layout() -> void:

	# Área reservada ao Luís.
	luis.anchor_left = 0.65
	luis.anchor_top = 0.08
	luis.anchor_right = 0.99
	luis.anchor_bottom = 1.33

	luis.offset_left = 0
	luis.offset_top = 0
	luis.offset_right = 0
	luis.offset_bottom = 0

	# Permite redimensionar o PNG.
	luis.custom_minimum_size = Vector2.ZERO
	luis.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	
	# Preserva as proporções da imagem.
	luis.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED

	# Aparência.
	luis.visible = true
	luis.modulate = Color.WHITE
	luis.self_modulate = Color.WHITE

	# Camada visual.
	luis.z_index = 10
	luis.mouse_filter = Control.MOUSE_FILTER_IGNORE

	# Escala padrão.
	luis.scale = Vector2.ONE


func _configure_dialogue_layout() -> void:

	# Posição e dimensões do painel.
	dialogue_panel.anchor_left = 0.025
	dialogue_panel.anchor_top = 0.70
	dialogue_panel.anchor_right = 0.67
	dialogue_panel.anchor_bottom = 0.90

	dialogue_panel.offset_left = 0
	dialogue_panel.offset_top = 0
	dialogue_panel.offset_right = 0
	dialogue_panel.offset_bottom = 0

	dialogue_panel.custom_minimum_size = Vector2.ZERO

	# Estilo bege do Korno's.
	var bubble := StyleBoxFlat.new()

	bubble.bg_color = Color("#F4E8D5")
	bubble.border_color = Color("#704B35")

	bubble.set_border_width_all(2)
	bubble.set_corner_radius_all(18)

	bubble.shadow_color = Color(0, 0, 0, 0.25)
	bubble.shadow_size = 7
	bubble.shadow_offset = Vector2(0, 4)

	bubble.content_margin_left = 20
	bubble.content_margin_right = 20
	bubble.content_margin_top = 12
	bubble.content_margin_bottom = 12

	dialogue_panel.add_theme_stylebox_override(
		"panel", bubble
	)

	# Nome do Luís.
	character_name.add_theme_font_size_override(
		"font_size", 21
	)
	character_name.add_theme_color_override(
		"font_color", Color("#69442E")
	)

	# Texto da fala.
	dialogue_text.add_theme_font_size_override(
		"font_size", 20
	)
	dialogue_text.add_theme_color_override(
		"font_color", Color("#382B23")
	)

	dialogue_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	dialogue_text.custom_minimum_size = Vector2(0, 55)

	# Espaçamento interno.
	$DialoguePanel/VBoxContainer.add_theme_constant_override(
		"separation", 6
	)


func _configure_continue_button() -> void:

	var normal := StyleBoxFlat.new()
	normal.bg_color = Color("#E8D0AC")
	normal.border_color = Color("#704B35")
	normal.set_border_width_all(2)
	normal.set_corner_radius_all(9)

	normal.content_margin_left = 18
	normal.content_margin_right = 18
	normal.content_margin_top = 7
	normal.content_margin_bottom = 7

	var hover := StyleBoxFlat.new()
	hover.bg_color = Color("#F0DAB9")
	hover.border_color = Color("#704B35")
	hover.set_border_width_all(2)
	hover.set_corner_radius_all(9)

	next_button.add_theme_stylebox_override(
		"normal", normal
	)
	next_button.add_theme_stylebox_override(
		"hover", hover
	)
	next_button.add_theme_font_size_override(
		"font_size", 17
	)

	next_button.add_theme_color_override(
		"font_color", Color("#563821")
	)
	next_button.custom_minimum_size = Vector2(145, 40)

	next_button.text = "Continuar  ›"


func _configure_hud_layout() -> void:

	# -------------------------
	# PAINEL DE DINHEIRO
	# -------------------------
	money_panel.anchor_left = 1.0
	money_panel.anchor_right = 1.0

	money_panel.anchor_top = 0.0
	money_panel.anchor_bottom = 0.0

	money_panel.offset_left = -555
	money_panel.offset_right = -295

	money_panel.offset_top = 28
	money_panel.offset_bottom = 88

	money_panel.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	money_panel.stretch_mode = TextureRect.STRETCH_SCALE

	money_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	money_panel.z_index = 30


	# -------------------------
	# PAINEL DO DIA
	# -------------------------

	day_panel.anchor_left = 1.0
	day_panel.anchor_right = 1.0

	day_panel.anchor_top = 0.0
	day_panel.anchor_bottom = 0.0

	day_panel.offset_left = -252
	day_panel.offset_right = -92

	day_panel.offset_top = 28
	day_panel.offset_bottom = 88

	day_panel.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	day_panel.stretch_mode = TextureRect.STRETCH_SCALE

	day_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	day_panel.z_index = 30


func _configure_hud_labels() -> void:

	# -------------------------
	# VALOR DO DINHEIRO
	# -------------------------

	money_label.anchor_left = 0.28
	money_label.anchor_top = 0.0
	money_label.anchor_right = 0.98
	money_label.anchor_bottom = 1.0

	money_label.offset_left = 0
	money_label.offset_top = 0
	money_label.offset_right = 0
	money_label.offset_bottom = 0

	money_label.text = "R$ 300,00"

	money_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	money_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER

	money_label.add_theme_font_size_override(
		"font_size", 22
	)

	money_label.add_theme_color_override(
		"font_color", Color("#653E24")
	)

	money_label.mouse_filter = Control.MOUSE_FILTER_IGNORE


	# -------------------------
	# NÚMERO DO DIA
	# -------------------------

	day_label.anchor_left = 0.40
	day_label.anchor_top = 0.0
	day_label.anchor_right = 0.98
	day_label.anchor_bottom = 1.0

	day_label.offset_left = 0
	day_label.offset_top = 0
	day_label.offset_right = 0
	day_label.offset_bottom = 0

	day_label.text = "01"

	day_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	day_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER

	day_label.add_theme_font_size_override(
		"font_size", 23
	)
	day_label.add_theme_color_override(
		"font_color", Color("#A52D43")
	)
	day_label.mouse_filter = Control.MOUSE_FILTER_IGNORE



const AFTER_CLEAN_DIALOGUES: Array[Dictionary] = [

	{
		"text": "Que belo trabalho, Belo! Mas não pense que acabou.",
		"sprite": "res://art/characters/luis/luis_joinha.png"
	},

	{
		"text": "Acabei de receber uma notificação de uma promoção em um supermercado atacadista. É uma boa oportunidade para abastecer nosso estoque e economizar.",
		"sprite": "res://art/characters/luis/luis_explicando.png"
	},

	{
		"text": "Precisamos comprar 5 pacotes de arroz, 4 sacos de açúcar e 3 pacotes de feijão, já que é a compra mínima do mercado. Mas atenção: são exatamente essas quantidades, então não adianta comprar mais ou menos, beleza?",
		"sprite": "res://art/characters/luis/luis_explicando.png"
	},

	{
		"text": "Quando terminar as compras, podemos encerrar o seu primeiro dia.",
		"sprite": "res://art/characters/luis/luis_joinha.png"
	}

]


const DAY_END_DIALOGUES: Array[Dictionary] = [

	{
		"text": "Excelente trabalho, Belo! Conseguimos abastecer nossas prateleiras com arroz, feijão e açúcar. Nosso supermercado está começando a ganhar vida novamente!",
		"sprite": "res://art/characters/luis/luis_explicando.png"
	},

	{
		"text": "Por hoje é só! Você concluiu seu primeiro dia no Korno's. Amanhã teremos novos desafios pela frente. Até lá!",
		"sprite": "res://art/characters/luis/luis_joinha.png"
	}

]


func _display_luis_dialogue(dialogue: Dictionary) -> void:

	var sprite_path: String = dialogue["sprite"]

	if ResourceLoader.exists(sprite_path):
		var sprite := load(sprite_path) as Texture2D

		if sprite != null:
			luis.texture = sprite
	else:
		push_error("Sprite do Luís não encontrado: " + sprite_path)
		return

	luis.show()
	dialogue_panel.show()

	character_name.text = "Luís"
	dialogue_text.text = dialogue["text"]
	dialogue_text.visible_characters = 0
	
	next_button.show()
	next_button.text = "Continuar  ›"

	is_typing = true
	typewriter_timer.start()


func _show_after_clean_dialogue() -> void:

	if after_clean_index < AFTER_CLEAN_DIALOGUES.size():
		_display_luis_dialogue(
			AFTER_CLEAN_DIALOGUES[after_clean_index]
		)


func _show_day_end_dialogue() -> void:

	if day_end_index < DAY_END_DIALOGUES.size():
		_display_luis_dialogue(
			DAY_END_DIALOGUES[day_end_index]
		)

func _on_cart_mouse_entered() -> void:

	if cart_button.visible and not purchase_overlay.visible:
		offer_tooltip.show()


func _on_cart_mouse_exited() -> void:

	offer_tooltip.hide()


func _on_cart_pressed() -> void:
	offer_tooltip.hide()

	purchase_overlay.show()

	_update_purchase_display()
