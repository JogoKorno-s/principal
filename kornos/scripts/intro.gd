
extends Control

const TUTORIAL_FACADE_PATH := "res://scenes/story/tutorial_facade.tscn"


const SLIDES := [
	{
		"path": "res://art/backgrounds/intro/cena1.jpg",
		"text": "Naquele dia, Belo acreditava ter encontrado o amor da sua vida."
	},
	{
		"path": "res://art/backgrounds/intro/cena2.jpg",
		"text": "Com o nascimento de Enzo, sua família parecia completa."
	},
	{
		"path": "res://videos/intro/cena3.ogv",
		"text": "Mas em pouco tempo uma traição destruiu tudo o que ele havia construído."
	},
	{
		"path": "res://videos/intro/cena4.ogv",
		"text": "Anos de amor chegaram ao fim."
	},
	{
		"path": "res://videos/intro/cena5.ogv",
		"text": "Grazi seguiu com sua nova paixão, enquanto Belo e seu filho precisavam lidar com as consequências daquela separação."
	},
	{
		"path": "res://videos/intro/cena6.ogv",
		"text": "Enquanto Grazi aproveitava sua vida de luxo, Belo enfrentava as dificuldades de recomeçar do zero."
	},
	{
		"path": "res://videos/intro/cena7.ogv",
		"text": "Quando acreditou que já havia perdido tudo, recebeu a notícia sobre a morte de seu avô José."
	},
	{
		"path": "res://art/backgrounds/intro/cena8.jpeg",
		"text": "Mas José havia deixado uma pequena luz em meio à escuridão para seu neto."
	},
	{
		"path": "res://videos/intro/cena9.ogv",
		"text": "O antigo supermercado Korno's não era apenas uma herança. Era sua única chance."
	},
	{
		"path": "res://videos/intro/cena10.ogv",
		"text": "Sem dinheiro, sem experiência e sem garantias de sucesso, Belo decidiu lutar pelo futuro que restava para ele e seu filho."
	},
	{
		"path": "res://videos/intro/cena10.ogv",
		"text": "O destino do Korno's agora está em suas mãos.",
		"final": true
	}
]

var current_slide: int = 0
var is_typing: bool = false

@onready var image_background: TextureRect = $ImageBackground
@onready var video_background: VideoStreamPlayer = $VideoBackground

@onready var dialogue_panel: PanelContainer = $DialoguePanel
@onready var dialogue_text: Label = $DialoguePanel/DialogueVBox/DialogueText
@onready var continue_button: BaseButton = $DialoguePanel/DialogueVBox/ContinueButton
@onready var typewriter_timer: Timer = $TypewriterTimer

@onready var final_screen: Control = $FinalScreen
@onready var final_background: ColorRect = $FinalScreen/FinalBackground
@onready var final_message: Label = $FinalScreen/CenterContainer/FinalVBox/FinalMessage
@onready var start_journey_button: BaseButton = $FinalScreen/CenterContainer/FinalVBox/StartJourneyButton


func _ready() -> void:
	image_background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	video_background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

	image_background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	video_background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	video_background.expand = true

	final_screen.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	final_background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	final_background.color = Color(0.0, 0.0, 0.0, 0.55)
	final_background.mouse_filter = Control.MOUSE_FILTER_IGNORE

	dialogue_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART

	typewriter_timer.wait_time = 0.025
	typewriter_timer.one_shot = false

	continue_button.pressed.connect(_on_continue_pressed)
	start_journey_button.pressed.connect(_on_start_journey_pressed)
	typewriter_timer.timeout.connect(_on_typewriter_timeout)

	final_screen.hide()
	_show_slide()


func _show_slide() -> void:
	is_typing = false
	typewriter_timer.stop()

	image_background.hide()
	video_background.stop()
	video_background.hide()
	dialogue_panel.hide()
	final_screen.hide()

	var slide: Dictionary = SLIDES[current_slide]
	var path: String = slide["path"]
	var is_final: bool = slide.get("final", false)

	if not ResourceLoader.exists(path):
		push_error("Arquivo não encontrado: " + path)
		return

	var resource = load(path)

	if resource is Texture2D:
		image_background.texture = resource
		image_background.show()

	elif resource is VideoStream:
		video_background.stream = resource
		video_background.loop = true

		# o áudio dos vídeos da intro fica habilitado
		# pra silenciar, alterar aq para -80.0
		video_background.volume_db = 0.0

		video_background.show()
		video_background.play()

	else:
		push_error("Arquivo incompatível: " + path)
		return

	if is_final:
		dialogue_panel.hide()

		final_message.text = slide["text"]
		final_message.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		start_journey_button.show()

		final_screen.show()
		return

	dialogue_panel.show()
	dialogue_text.text = slide["text"]
	dialogue_text.visible_characters = 0
	continue_button.text = "Continuar"

	is_typing = true
	typewriter_timer.start()


func _on_typewriter_timeout() -> void:
	if dialogue_text.visible_characters < dialogue_text.text.length():
		dialogue_text.visible_characters += 1
	else:
		typewriter_timer.stop()
		is_typing = false


func _on_continue_pressed() -> void:
	if is_typing:
		is_typing = false
		typewriter_timer.stop()
		dialogue_text.visible_characters = -1
		return

	if current_slide < SLIDES.size() - 1:
		current_slide += 1
		_show_slide()


func _on_start_journey_pressed() -> void:
	if not ResourceLoader.exists(TUTORIAL_FACADE_PATH):
		push_error("Cena da fachada com Luís não encontrada: " + TUTORIAL_FACADE_PATH)
		return

	var error := get_tree().change_scene_to_file(TUTORIAL_FACADE_PATH)

	if error != OK:
		push_error("Não foi possível abrir a fachada com Luís.")
