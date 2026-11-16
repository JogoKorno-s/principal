extends TextureRect
## Produto que pode ser arrastado na prateleira. A posição fica salva no GameState.

@export var product_type: String = "rice"   # rice, beans ou sugar
@export var stock_index: int = 1            # 1 = 1º pacote, 2 = 2º pacote...

var _dragging := false
var _grab_offset := Vector2.ZERO


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	refresh()


func refresh() -> void:
	# Só aparece se o estoque tiver esse pacote (ex.: arroz 5 -> Arroz1..Arroz5)
	var stock = GameState.get(product_type + "_stock")
	if stock != null:
		visible = stock_index <= int(stock)
	# Restaura a posição que o jogador deixou
	var key := String(name)
	if GameState.shelf_item_positions.has(key):
		position = GameState.shelf_item_positions[key]


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			_dragging = true
			_grab_offset = get_global_mouse_position() - global_position
			move_to_front()
			accept_event()
		elif _dragging:
			_dragging = false
			GameState.shelf_item_positions[String(name)] = position
			accept_event()
	elif event is InputEventMouseMotion and _dragging:
		global_position = get_global_mouse_position() - _grab_offset
		_clamp_to_parent()
		accept_event()


func _clamp_to_parent() -> void:
	var area := get_parent() as Control
	if area == null:
		return
	var max_pos := area.size - size * scale
	position = position.clamp(Vector2.ZERO, max_pos)
