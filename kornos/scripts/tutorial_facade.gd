
extends Control



const DIALOGUES: Array[Dictionary] = [

	{
		"text": "Oi, Belo! Sou o Luís, seu vizinho. Vou te ajudar a colocar o Korno's de pé novamente.",
		"sprite": "res://art/characters/luis/luis_oi.png",
		"scale": 1.0
	},

	{
		"text": "Seu avô deixou esse mercado para você. Ele está precisando de cuidados, mas vamos resolver uma coisa de cada vez.",
		"sprite": "res://art/characters/luis/luis_explicando.png",
		"scale": 1.0
	},

	{
		"text": "Vamos começar entrando no mercado. Quando terminarmos, clique na porta para ver como está lá dentro.",
		"sprite": "res://art/characters/luis/luis_joinha.png",
		"scale": 0.60
	}

]



var dialogue_index: int = 0
var is_typing: bool = false

@onready var luis: TextureRect = $Luis
@onready var dialogue_panel: PanelContainer = $DialoguePanel
@onready var character_name: Label = $DialoguePanel/VBoxContainer/CharacterName
@onready var dialogue_text: Label = $DialoguePanel/VBoxContainer/DialogueText
@onready var next_button: Button = $DialoguePanel/VBoxContainer/ButtonRow/NextButton
@onready var enter_store_button: Button = $EnterStoreButton
@onready var typewriter_timer: Timer = $TypewriterTimer



func _ready() -> void:
	character_name.text = "Luís"

	next_button.pressed.connect(_on_next_pressed)
	enter_store_button.pressed.connect(_on_enter_store_pressed)
	typewriter_timer.timeout.connect(_on_typewriter_timeout)

	typewriter_timer.wait_time = 0.035
	typewriter_timer.one_shot = false

	enter_store_button.hide()

	_show_dialogue()
	
	_apply_luis_dialogue_style()
	_apply_continue_button_style()

	await get_tree().process_frame
	_configure_luis()


func _show_dialogue() -> void:

	typewriter_timer.stop()

	var dialogue: Dictionary = DIALOGUES[dialogue_index]

	# Atualiza a imagem do Luís.
	var sprite_path: String = dialogue["sprite"]

	if ResourceLoader.exists(sprite_path):
		luis.texture = load(sprite_path) as Texture2D
	else:
		push_error("Sprite do Luís não encontrado: " + sprite_path)
		return

	# Atualiza a fala.
	dialogue_text.text = dialogue["text"]
	dialogue_text.visible_characters = 0

	character_name.text = "Luís"

	is_typing = true
	next_button.text = "Continuar  ›"

	typewriter_timer.start()
	
	# Aplica o tamanho correspondente à expressão.
	var sprite_scale: float = float(dialogue.get("scale", 1.0))

	luis.pivot_offset = luis.size / 2
	luis.scale = Vector2(sprite_scale, sprite_scale)



func _on_typewriter_timeout() -> void:
	if dialogue_text.visible_characters < dialogue_text.text.length():
		dialogue_text.visible_characters += 1
	else:
		typewriter_timer.stop()
		is_typing = false


func _on_next_pressed() -> void:
	if is_typing:
		dialogue_text.visible_characters = dialogue_text.text.length()
		typewriter_timer.stop()
		is_typing = false
		return

	if dialogue_index < DIALOGUES.size() - 1:
		dialogue_index += 1
		_show_dialogue()
	else:
		dialogue_panel.hide()
		enter_store_button.show()


func _on_enter_store_pressed() -> void:
	await SceneTransition.change_scene(
        "res://scenes/locations/dirty_store.tscn"
	)
	
	

func _apply_luis_dialogue_style() -> void:

	# Posicionamento do balão.

# Balão mais compacto, na parte inferior esquerda.
	dialogue_panel.anchor_left = 0.025
	dialogue_panel.anchor_top = 0.70
	dialogue_panel.anchor_right = 0.70
	dialogue_panel.anchor_bottom = 0.90

	dialogue_panel.offset_left = 0
	dialogue_panel.offset_top = 0
	dialogue_panel.offset_right = 0
	dialogue_panel.offset_bottom = 0


	# Aparência do painel.
	var bubble := StyleBoxFlat.new()

	bubble.bg_color = Color("#F4E8D5")
	bubble.border_color = Color("#704B35")

	bubble.set_border_width_all(2)
	bubble.set_corner_radius_all(18)

	bubble.shadow_color = Color(0, 0, 0, 0.25)
	bubble.shadow_size = 7
	bubble.shadow_offset = Vector2(0, 4)

	bubble.content_margin_left = 24
	bubble.content_margin_right = 24
	bubble.content_margin_top = 18
	bubble.content_margin_bottom = 14

	dialogue_panel.add_theme_stylebox_override(
		"panel", bubble
	)

	# Nome do personagem.
	character_name.add_theme_font_size_override(
		"font_size", 23
	)
	character_name.add_theme_color_override(
		"font_color", Color("#69442E")
	)

	# Texto.
	dialogue_text.add_theme_font_size_override(
		"font_size", 23
	)
	dialogue_text.add_theme_color_override(
		"font_color", Color("#382B23")
	)
	dialogue_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART

	# Espaçamento.
	dialogue_text.custom_minimum_size = Vector2(0, 85)

	# Organização vertical.
	$DialoguePanel/VBoxContainer.add_theme_constant_override(
		"separation", 10
	)



func _apply_continue_button_style() -> void:

	var normal := StyleBoxFlat.new()
	normal.bg_color = Color("#E8D0AC")
	normal.border_color = Color("#704B35")
	normal.set_border_width_all(2)
	normal.set_corner_radius_all(10)

	normal.content_margin_left = 20
	normal.content_margin_right = 20
	normal.content_margin_top = 9
	normal.content_margin_bottom = 9

	var hover := StyleBoxFlat.new()
	hover.bg_color = Color("#F0DAB9")
	hover.border_color = Color("#704B35")
	hover.set_border_width_all(2)
	hover.set_corner_radius_all(10)

	var pressed := StyleBoxFlat.new()
	pressed.bg_color = Color("#D6B88F")
	pressed.border_color = Color("#704B35")
	pressed.set_border_width_all(2)
	pressed.set_corner_radius_all(10)

	next_button.add_theme_stylebox_override("normal", normal)
	next_button.add_theme_stylebox_override("hover", hover)
	next_button.add_theme_stylebox_override("pressed", pressed)

	next_button.add_theme_color_override(
		"font_color", Color("#563821")
	)

	next_button.add_theme_color_override(
		"font_hover_color", Color("#392316")
	)

	next_button.add_theme_color_override(
		"font_pressed_color", Color("#392316")
	)

	next_button.add_theme_font_size_override(
		"font_size", 19
	)

	next_button.custom_minimum_size = Vector2(155, 43)
	next_button.text = "Continuar  ›"



func _configure_luis() -> void:

		# Posiciona o Luís na lateral direita.
	
	luis.anchor_left = 0.66
	luis.anchor_top = 0.08
	luis.anchor_right = 0.99
	luis.anchor_bottom = 1.33

	# Zera os deslocamentos.
	luis.offset_left = 0
	luis.offset_top = 0
	luis.offset_right = 0
	luis.offset_bottom = 0

	# Configuração da imagem.
	luis.custom_minimum_size = Vector2.ZERO
	luis.expand_mode = TextureRect.EXPAND_IGNORE_SIZE	
	luis.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED

	# Aparência e interação.
	luis.visible = true
	luis.modulate = Color.WHITE
	luis.self_modulate = Color.WHITE
	luis.z_index = 10
	luis.mouse_filter = Control.MOUSE_FILTER_IGNORE

	# Ponto central para redimensionar as expressões.
	luis.pivot_offset = luis.size / 2
	luis.scale = Vector2.ONE
