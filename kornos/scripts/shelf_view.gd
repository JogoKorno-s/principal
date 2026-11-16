extends Control
## Prateleira ampliada: produtos encaixam em vagas (ímã) e a vaga fica salva no GameState.

signal closed

@onready var back_button: BaseButton = $BackButton
@onready var rows_node: Control = $Rows
@onready var products_node: Control = $Products

var _busy := false
var _rows: Array = []
var _occupied := {}      # "Row2:3" -> produto
var _product_slot := {}  # produto -> "Row2:3"


func _ready() -> void:
	visible = false
	mouse_filter = Control.MOUSE_FILTER_STOP
	back_button.pressed.connect(_on_back_pressed)
	for row in rows_node.get_children():
		if row.has_method("get_slot_index_at"):
			_rows.append(row)
	for p in _products():
		p.drag_started.connect(_on_drag_started)
		p.drag_moved.connect(_on_drag_moved)
		p.dropped.connect(_on_dropped)


func open() -> void:
	if _busy:
		return
	_busy = true
	await SceneTransition.fade_to_black()
	visible = true
	await get_tree().process_frame      # garante que os tamanhos já foram calculados
	_layout_products()
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


# ---------------- Posicionamento ----------------

func _products() -> Array:
	var list := []
	for child in products_node.get_children():
		if child.has_method("is_in_stock"):
			list.append(child)
	return list


func _layout_products() -> void:
	_occupied.clear()
	_product_slot.clear()
	var saved: Dictionary = GameState.shelf_item_slots
	var pending := []

	for p in _products():
		p.visible = p.is_in_stock()
		if not p.visible:
			continue
		var key: String = saved.get(String(p.name), "")
		if key != "" and _slot_exists(key) and not _occupied.has(key):
			_assign(p, key, false)
		else:
			pending.append(p)

	# Primeira vez: usa a vaga onde você deixou o produto no editor
	for p in pending:
		var key := _slot_key_at(p.get_global_rect().get_center())
		if key == "" or _occupied.has(key):
			key = _first_free_slot()
		if key != "":
			_assign(p, key, false)

	_save()


func _assign(p: Control, key: String, animate: bool) -> void:
	var old: String = _product_slot.get(p, "")
	if old != "" and _occupied.get(old) == p:
		_occupied.erase(old)
	_occupied[key] = p
	_product_slot[p] = key

	var target := _snap_position(p, key)
	if animate:
		var tween := create_tween()
		tween.tween_property(p, "position", target, 0.12).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	else:
		p.position = target


func _snap_position(p: Control, key: String) -> Vector2:
	# Produto fica "em pé" no fundo da vaga, centralizado
	var r := _slot_rect(key)
	var bottom_center_global := Vector2(r.get_center().x, r.end.y)
	var local := products_node.get_global_transform().affine_inverse() * bottom_center_global
	var visual_size := p.size * p.scale
	return local - Vector2(visual_size.x / 2.0, visual_size.y)


func _save() -> void:
	var data := {}
	for p in _product_slot.keys():
		data[String(p.name)] = _product_slot[p]
	GameState.shelf_item_slots = data


# ---------------- Arrastar / soltar ----------------

func _on_drag_started(_p: Control) -> void:
	_update_guides(get_global_mouse_position())


func _on_drag_moved(_p: Control) -> void:
	_update_guides(get_global_mouse_position())


func _on_dropped(p: Control) -> void:
	_hide_guides()
	var target := _slot_key_at(get_global_mouse_position())
	var current: String = _product_slot.get(p, "")

	if target == "":
		if current != "":
			_assign(p, current, true)   # soltou fora da prateleira: volta
		return

	var other = _occupied.get(target)
	if other != null and other != p and current != "":
		_assign(other, current, true)   # vaga ocupada: troca de lugar

	_assign(p, target, true)
	_save()


func _update_guides(mouse: Vector2) -> void:
	for row in _rows:
		row.set_guides(true, row.get_slot_index_at(mouse))


func _hide_guides() -> void:
	for row in _rows:
		row.set_guides(false)


# ---------------- Vagas ----------------

func _slot_key_at(global_point: Vector2) -> String:
	for row in _rows:
		var i: int = row.get_slot_index_at(global_point)
		if i >= 0:
			return "%s:%d" % [row.name, i]
	return ""


func _slot_exists(key: String) -> bool:
	var parts := key.split(":")
	if parts.size() != 2:
		return false
	var row = rows_node.get_node_or_null(parts[0])
	return row != null and int(parts[1]) < row.slot_count


func _slot_rect(key: String) -> Rect2:
	var parts := key.split(":")
	var row = rows_node.get_node(parts[0])
	return row.get_slot_global_rect(int(parts[1]))


func _first_free_slot() -> String:
	for row in _rows:
		for i in row.slot_count:
			var key := "%s:%d" % [row.name, i]
			if not _occupied.has(key):
				return key
	return ""
