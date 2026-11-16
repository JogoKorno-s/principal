extends Control
## Dia 2 — provisório. Vamos construir a missão depois.

@onready var progress_button: BaseButton = $ProgressButton
@onready var placeholder_label: Label = $PlaceholderLabel


func _ready() -> void:
	progress_button.pressed.connect(ProgressTimeline.open)
	placeholder_label.text = "Dia %d — em construção" % GameState.current_day
