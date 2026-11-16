extends Control
## Visualização ampliada da prateleira (overlay dentro da dirty_store).

signal closed

@onready var back_button: BaseButton = $BackButton
@onready var products_area: Control = $ProductsArea

var _busy := false


func _ready() -> void:
	visible = false
	mouse_filter = Control.MOUSE_FILTER_STOP   # impede cliques no mercado por trás
	back_button.pressed.connect(_on_back_pressed)


func open() -> void:
	if _busy:
		return
	_busy = true
	for product in products_area.get_children():
		if product.has_method("refresh"):
			product.refresh()
	await SceneTransition.fade_to_black()
	visible = true
	await SceneTransition.fade_from_black()
	_busy = false


func _on_back_pressed() -> void:
	if _busy:
		return
	_busy = true
	await SceneTransition.fade_to_black()
	visible = false
	await SceneTransition.fade_from_black()
	_busy = false
	closed.emit()
