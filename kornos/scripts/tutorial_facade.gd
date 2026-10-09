
extends Control

const DIALOGUES: Array[String] = [
	"Oi, Belo! Sou o Luís, seu vizinho. Vou te ajudar a colocar o Korno's de pé novamente.",
	"Seu avô deixou esse mercado para você. Ele está precisando de cuidados, mas vamos resolver uma coisa de cada vez.",
    "Vamos começar entrando no mercado. Quando terminarmos, clique na porta para ver como está lá dentro."
]

var dialogue_index: int = 0
var is_typing: bool = false

@onready var dialogue_panel: PanelContainer = $DialoguePanel
@onready var character_name: Label = $DialoguePanel/VBoxContainer/CharacterName
@onready var dialogue_text: Label = $DialoguePanel/VBoxContainer/DialogueText
@onready var next_button: Button = $DialoguePanel/VBoxContainer/NextButton
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


func _show_dialogue() -> void:
	dialogue_text.text = DIALOGUES[dialogue_index]
	dialogue_text.visible_characters = 0

	is_typing = true
	next_button.text = "Continuar"

	if dialogue_index == DIALOGUES.size() - 1:
		next_button.text = "Concluir"

	typewriter_timer.start()


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
	var error := get_tree().change_scene_to_file(
        "res://scenes/locations/dirty_store.tscn"
	)

	if error != OK:
		push_error("Não foi possível abrir o interior do supermercado.")
