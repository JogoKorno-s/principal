@tool
extends Control
## Uma fileira da prateleira, dividida automaticamente em vagas (slots).

@export var slot_count: int = 8:
	set(value):
		slot_count = max(1, value)
		queue_redraw()
@export var drop_margin: float = 30.0   # tolerância (px) acima/abaixo para soltar

var _show_guides := false
var _highlight := -1


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	resized.connect(queue_redraw)


func set_guides(enabled: bool, highlight: int = -1) -> void:
	_show_guides = enabled
	_highlight = highlight
	queue_redraw()


func get_slot_index_at(global_point: Vector2) -> int:
	var rect := get_global_rect().grow_individual(0, drop_margin, 0, drop_margin * 0.5)
	if not rect.has_point(global_point):
		return -1
	var slot_w := rect.size.x / slot_count
	return clampi(int((global_point.x - rect.position.x) / slot_w), 0, slot_count - 1)


func get_slot_global_rect(index: int) -> Rect2:
	var rect := get_global_rect()
	var slot_w := rect.size.x / slot_count
	return Rect2(rect.position + Vector2(slot_w * index, 0), Vector2(slot_w, rect.size.y))


func _draw() -> void:
	# No editor as vagas sempre aparecem; no jogo, só enquanto arrasta.
	if not Engine.is_editor_hint() and not _show_guides:
		return
	var slot_w := size.x / slot_count
	for i in slot_count:
		var r := Rect2(Vector2(slot_w * i, 0), Vector2(slot_w, size.y))
		if i == _highlight:
			draw_rect(r, Color(0.4, 0.9, 0.4, 0.35))
		draw_rect(r.grow(-2), Color(1.0, 0.95, 0.6, 0.7), false, 2.0)
