grant execute on function private.reserve_media_upload_impl(text, text, bigint, text, text, text, text)
to authenticated;
grant execute on function private.finalize_media_upload_impl(uuid, text)
to authenticated;
grant execute on function private.cancel_media_upload_impl(uuid)
to authenticated;
grant execute on function private.update_media_metadata_impl(uuid, text, text, text, text)
to authenticated;
