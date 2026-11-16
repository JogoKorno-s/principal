extends CanvasLayer
## Linha do tempo de progresso (Autoload "ProgressTimeline").
## Abra de qualquer cena com: ProgressTimeline.open()
## O Voltar só fecha o overlay: o jogador volta exatamente onde estava.

const DESIGN_WIDTH := 1280.0
const MAP_HEIGHT := 2400.0
const MAP_MARGIN := 260.0
const MARKER_SIZE := 150.0
const CARD_WIDTH := 300.0
const DRAG_THRESHOLD := 10.0
const X_FRACTIONS := [0.45, 0.66, 0.34, 0.64, 0.46]   # zigue-zague dos níveis 1..5

const COLOR_COMPLETED := Color("6aa84f")
const COLOR_UNLOCKED := Color("f1c232")
const COLOR_LOCKED := Color("9a9a9a")
const COLOR_BROWN := Color("4a2c1a")
const COLOR_CREAM := Color("fdf3dc")
const COLOR_ROAD := Color("e8cfa0")

@onready var root: Control = $Root
@onready var background: TextureRect = $Root/Background
@onready var scroll: ScrollContainer = $Root/Scroll
@onready var map: Control = $Root/Scroll/Map
@onready var info_label: Label = $Root/InfoLabel
@onready var back_button: BaseButton = $Root/BackButton

var _markers := {}          # nível -> {"button": Button, "status": Label}
var _road_progress: Line2D
var _here_tag: PanelContainer
var _pulse_tween: Tween
var _pressing := false
var _drag_distance := 0.0
var _scroll_accum := 0.0


func _ready() -> void:
	layer = 50
	root.visible = false
	root.mouse_filter = Control.MOUSE_FILTER_STOP
	back_button.pressed.connect(close)
	GameState.progress_changed.connect(_refresh)   # atualiza sempre que o progresso/dia muda

	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	map.custom_minimum_size = Vector2(DESIGN_WIDTH, MAP_HEIGHT)
	map.mouse_filter = Control.MOUSE_FILTER_PASS

	if background.texture == null:
		background.texture = _make_gradient()
	_build_map()
	_refresh()


# ---------------- Abrir / fechar ----------------

func open() -> void:
	_refresh()
	_show_info("Arraste para cima e para baixo para ver sua jornada")
	root.modulate.a = 0.0
	root.visible = true
	create_tween().tween_property(root, "modulate:a", 1.0, 0.25)
	await get_tree().process_frame
	_scroll_to_level(GameState.highest_unlocked_level, false)


func close() -> void:
	var tween := create_tween()
	tween.tween_property(root, "modulate:a", 0.0, 0.2)
	await tween.finished
	root.visible = false


# ---------------- Montagem do mapa ----------------

func _build_map() -> void:
	var road_border := _make_line(78.0, COLOR_BROWN)
	var road_fill := _make_line(62.0, COLOR_ROAD)
	_road_progress = _make_line(22.0, COLOR_UNLOCKED)
	var full := _road_points(GameState.LEVELS.size(), true)
	road_border.points = full
	road_fill.points = full

	for data in GameState.LEVELS:
		_create_marker(data)

	_here_tag = _make_tag("VOCÊ ESTÁ AQUI")
	map.add_child(_here_tag)


func _create_marker(data: Dictionary) -> void:
	var n: int = data["level"]
	var center := _level_position(n)

	var button := Button.new()
	button.text = str(n)
	button.focus_mode = Control.FOCUS_NONE
	button.custom_minimum_size = Vector2(MARKER_SIZE, MARKER_SIZE)
	button.size = Vector2(MARKER_SIZE, MARKER_SIZE)
	button.position = center - button.size / 2.0
	button.pivot_offset = button.size / 2.0
	button.add_theme_font_size_override("font_size", 60)
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(_on_level_pressed.bind(n))
	map.add_child(button)

	var card := PanelContainer.new()
	card.mouse_filter = Control.MOUSE_FILTER_PASS
	card.custom_minimum_size = Vector2(CARD_WIDTH, 0)
	card.add_theme_stylebox_override("panel", _make_box(COLOR_CREAM, COLOR_BROWN, 18, 4))
	var vbox := VBoxContainer.new()
	card.add_child(vbox)

	vbox.add_child(_make_label("NÍVEL %d  -  DIA %d" % [n, data["day"]], 17))
	vbox.add_child(_make_label(data["title"], 26))
	vbox.add_child(_make_label(data["desc"], 16))
	var status := _make_label("", 18)
	vbox.add_child(status)

	var card_on_right := center.x < DESIGN_WIDTH / 2.0
	var card_x := center.x + MARKER_SIZE / 2.0 + 24.0 if card_on_right else center.x - MARKER_SIZE / 2.0 - 24.0 - CARD_WIDTH
	card.position = Vector2(card_x, center.y - 70.0)
	map.add_child(card)

	_markers[n] = {"button": button, "status": status}


# ---------------- Atualização (lê o GameState) ----------------

func _refresh() -> void:
	if _markers.is_empty():
		return
	if _pulse_tween:
		_pulse_tween.kill()
		_pulse_tween = null

	for n in _markers:
		var button: Button = _markers[n]["button"]
		var status_label: Label = _markers[n]["status"]
		button.scale = Vector2.ONE
		match GameState.get_level_status(n):
			"completed":
				_style_marker(button, COLOR_COMPLETED)
				status_label.text = "CONCLUÍDO"
				status_label.add_theme_color_override("font_color", COLOR_COMPLETED.darkened(0.35))
			"unlocked":
				_style_marker(button, COLOR_UNLOCKED)
				status_label.text = "DESBLOQUEADO - clique para jogar"
				status_label.add_theme_color_override("font_color", Color("b45f06"))
				_start_pulse(button)
			_:
				_style_marker(button, COLOR_LOCKED)
				status_label.text = "BLOQUEADO"
				status_label.add_theme_color_override("font_color", Color("666666"))

	var current: int = GameState.highest_unlocked_level
	_road_progress.points = _road_points(current, false)
	_here_tag.reset_size()
	var pos := _level_position(current)
	_here_tag.position = pos - Vector2(_here_tag.size.x / 2.0, MARKER_SIZE / 2.0 + _here_tag.size.y + 14.0)


# ---------------- Cliques nos níveis ----------------

func _on_level_pressed(n: int) -> void:
	if _drag_distance > DRAG_THRESHOLD:
		return   # foi um arraste, não um clique
	var button: Button = _markers[n]["button"]
	match GameState.get_level_status(n):
		"locked":
			_show_info("Nível %d bloqueado! Conclua o nível %d para desbloquear." % [n, n - 1])
			_shake(button)
		"completed":
			_show_info("Nível %d concluído! Ótimo trabalho." % n)
		"unlocked":
			var data: Dictionary = GameState.LEVELS[n - 1]
			var scene := get_tree().current_scene
			if scene and scene.scene_file_path == data["scene"]:
				_show_info("Você já está neste nível!")
				return
			await close()
			GameState.start_level(n)


# ---------------- Arrastar para rolar ----------------

func _input(event: InputEvent) -> void:
	if not root.visible:
		return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			_pressing = true
			_drag_distance = 0.0
			_scroll_accum = scroll.scroll_vertical
		else:
			_pressing = false
	elif event is InputEventMouseMotion and _pressing:
		_drag_distance += event.relative.length()
		if _drag_distance > DRAG_THRESHOLD:
			_scroll_accum -= event.relative.y
			scroll.scroll_vertical = int(_scroll_accum)


func _scroll_to_level(n: int, animate: bool) -> void:
	var target := int(_level_position(n).y - scroll.size.y / 2.0)
	target = clampi(target, 0, int(MAP_HEIGHT - scroll.size.y))
	if animate:
		create_tween().tween_property(scroll, "scroll_vertical", target, 0.5)
	else:
		scroll.scroll_vertical = target


# ---------------- Geometria do caminho ----------------

func _level_step() -> float:
	return (MAP_HEIGHT - MAP_MARGIN * 2.0) / float(GameState.LEVELS.size() - 1)


func _level_position(n: int) -> Vector2:
	# Nível 1 embaixo, nível 5 no topo
	return Vector2(DESIGN_WIDTH * X_FRACTIONS[n - 1], MAP_HEIGHT - MAP_MARGIN - _level_step() * (n - 1))


func _road_points(up_to: int, to_top: bool) -> PackedVector2Array:
	var step := _level_step()
	var curve := Curve2D.new()
	var first := _level_position(1)
	curve.add_point(Vector2(first.x, MAP_HEIGHT), Vector2.ZERO, Vector2(0, -step * 0.4))
	for n in range(1, up_to + 1):
		curve.add_point(_level_position(n), Vector2(0, step * 0.45), Vector2(0, -step * 0.45))
	if to_top:
		var last := _level_position(GameState.LEVELS.size())
		curve.add_point(Vector2(last.x, 0), Vector2(0, step * 0.4), Vector2.ZERO)
	return curve.tessellate()


# ---------------- Visual ----------------

func _make_line(width: float, color: Color) -> Line2D:
	var line := Line2D.new()
	line.width = width
	line.default_color = color
	line.joint_mode = Line2D.LINE_JOINT_ROUND
	line.begin_cap_mode = Line2D.LINE_CAP_ROUND
	line.end_cap_mode = Line2D.LINE_CAP_ROUND
	line.antialiased = true
	map.add_child(line)
	return line


func _make_box(bg: Color, border: Color, radius: int, border_width: int) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = bg
	box.border_color = border
	box.set_border_width_all(border_width)
	box.set_corner_radius_all(radius)
	box.content_margin_left = 16
	box.content_margin_right = 16
	box.content_margin_top = 10
	box.content_margin_bottom = 10
	box.shadow_color = Color(0, 0, 0, 0.25)
	box.shadow_size = 6
	box.shadow_offset = Vector2(0, 4)
	return box


func _style_marker(button: Button, color: Color) -> void:
	var r := int(MARKER_SIZE / 2.0)
	button.add_theme_stylebox_override("normal", _make_box(color, COLOR_BROWN, r, 6))
	button.add_theme_stylebox_override("hover", _make_box(color.lightened(0.15), COLOR_BROWN, r, 6))
	button.add_theme_stylebox_override("pressed", _make_box(color.darkened(0.15), COLOR_BROWN, r, 6))
	for state in ["font_color", "font_hover_color", "font_pressed_color"]:
		button.add_theme_color_override(state, COLOR_BROWN)


func _make_label(text: String, font_size: int) -> Label:
	var label := Label.new()
	label.text = text
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", COLOR_BROWN)
	return label


func _make_tag(text: String) -> PanelContainer:
	var tag := PanelContainer.new()
	tag.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tag.add_theme_stylebox_override("panel", _make_box(COLOR_BROWN, COLOR_CREAM, 14, 3))
	var label := _make_label(text, 18)
	label.autowrap_mode = TextServer.AUTOWRAP_OFF
	label.add_theme_color_override("font_color", COLOR_CREAM)
	tag.add_child(label)
	return tag


func _start_pulse(button: Button) -> void:
	_pulse_tween = create_tween().set_loops()
	_pulse_tween.tween_property(button, "scale", Vector2(1.08, 1.08), 0.6).set_trans(Tween.TRANS_SINE)
	_pulse_tween.tween_property(button, "scale", Vector2.ONE, 0.6).set_trans(Tween.TRANS_SINE)


func _shake(button: Button) -> void:
	var x := button.position.x
	var tween := create_tween()
	for offset in [12.0, -12.0, 8.0, -8.0, 0.0]:
		tween.tween_property(button, "position:x", x + offset, 0.05)


func _show_info(message: String) -> void:
	info_label.text = message


func _make_gradient() -> GradientTexture2D:
	var gradient := Gradient.new()
	gradient.set_color(0, Color("f7ead0"))
	gradient.set_color(1, Color("d39b62"))
	var tex := GradientTexture2D.new()
	tex.gradient = gradient
	tex.fill_from = Vector2(0, 0)
	tex.fill_to = Vector2(0, 1)
	return tex
