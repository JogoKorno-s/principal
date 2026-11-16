extends Control
## Tela "Nível 2 desbloqueado!" — aparece ao fim do Dia 1.

@onready var dimmer: ColorRect = $Dimmer
@onready var board: TextureRect = $Board
@onready var buttons: Control = $Buttons
@onready var next_day_button: BaseButton = $Buttons/NextDayButton
@onready var progress_button: BaseButton = $Buttons/ProgressButton


func _ready() -> void:
	# Garantia: estar nesta tela significa que o nível 1 foi concluído
	# (também permite testar esta cena direto com F6).
	if GameState.get_level_status(1) != "completed":
		GameState.complete_level(1)

	next_day_button.pressed.connect(_on_next_day_pressed)
	progress_button.pressed.connect(_on_progress_pressed)
	_play_intro()


func _play_intro() -> void:
	dimmer.modulate.a = 0.0
	board.modulate.a = 0.0
	buttons.modulate.a = 0.0
	board.pivot_offset = board.size / 2.0
	board.scale = Vector2(0.6, 0.6)

	var tween := create_tween()
	tween.tween_property(dimmer, "modulate:a", 1.0, 0.4)
	tween.tween_property(board, "modulate:a", 1.0, 0.2)
	tween.parallel().tween_property(board, "scale", Vector2.ONE, 0.5).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_property(buttons, "modulate:a", 1.0, 0.3)


func _on_next_day_pressed() -> void:
	GameState.start_level(2)


func _on_progress_pressed() -> void:
	ProgressTimeline.open()
