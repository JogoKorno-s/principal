extends TextureRect
## Produto arrastável. Quem decide onde ele encaixa é o shelf_view.gd.

signal drag_started(product)
signal drag_moved(product)
signal dropped(product)

@export var product_type: String = "rice"   # rice, beans ou sugar
@export var stock_index: int = 1            # conta separado por produto: 1, 2, 3...

var dragging := false
var _grab_offset := Vector2.ZERO


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND


func is_in_stock() -> bool:
	var stock = GameState.get(product_type + "_stock")
	return stock == null or stock_index <= int(stock)


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			dragging = true
			_grab_offset = get_parent().get_local_mouse_position() - position
			move_to_front()
			modulate = Color(1, 1, 1, 0.85)
			drag_started.emit(self)
			accept_event()
		elif dragging:
			dragging = false
			modulate = Color.WHITE
			dropped.emit(self)
			accept_event()
	elif event is InputEventMouseMotion and dragging:
		position = get_parent().get_local_mouse_position() - _grab_offset
		drag_moved.emit(self)
		accept_event()
