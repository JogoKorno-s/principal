
extends CanvasLayer

const FADE_DURATION := 0.4

var fade_rect: ColorRect
var is_changing_scene: bool = false


func _ready() -> void:
	layer = 100

	fade_rect = ColorRect.new()
	fade_rect.name = "FadeOverlay"
	fade_rect.color = Color.BLACK
	fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE

	fade_rect.set_anchors_and_offsets_preset(
		Control.PRESET_FULL_RECT
	)

	fade_rect.modulate.a = 0.0
	add_child(fade_rect)


func _animate_fade(target_alpha: float) -> void:
	var tween := create_tween()

	tween.set_trans(Tween.TRANS_SINE)
	tween.set_ease(Tween.EASE_IN_OUT)

	tween.tween_property(
		fade_rect,
		"modulate:a",
		target_alpha,
		FADE_DURATION
	)

	await tween.finished


func fade_to_black() -> void:
	fade_rect.mouse_filter = Control.MOUSE_FILTER_STOP
	await _animate_fade(1.0)


func fade_from_black() -> void:
	await _animate_fade(0.0)
	fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE


func change_scene(scene_path: String) -> void:
	if is_changing_scene:
		return

	if not ResourceLoader.exists(scene_path):
		push_error("Cena não encontrada: " + scene_path)
		return

	is_changing_scene = true

	await fade_to_black()

	var error := get_tree().change_scene_to_file(scene_path)

	if error != OK:
		push_error("Erro ao trocar de cena: " + str(error))
		await fade_from_black()
		is_changing_scene = false
		return

	await get_tree().process_frame

	await fade_from_black()

	is_changing_scene = false
