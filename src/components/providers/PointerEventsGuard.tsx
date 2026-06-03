import { useEffect } from "react";

/**
 * Самовосстановление от «зависшего» pointer-events: none на <body>.
 *
 * Radix (@radix-ui/react-dismissable-layer) при открытии модального оверлея
 * (Dialog, DropdownMenu, Select, Popover, …) выставляет
 * `document.body.style.pointerEvents = "none"` и снимает его лишь в cleanup
 * эффекта, опираясь на МОДУЛЬНУЮ переменную `originalBodyPointerEvents` и
 * общий Set слоёв. При быстрых открытиях/закрытиях или когда поддерево с
 * оверлеем размонтируется в момент его закрытия (например, страница на время
 * показывает спиннер), cleanup может восстановить тело в стейл-значение "none"
 * либо вовсе не отработать. Итог — весь интерфейс перестаёт реагировать на
 * клики: «кнопки больше не работают».
 *
 * Сторож держит инвариант: если body заблокирован, в DOM ОБЯЗАН присутствовать
 * хотя бы один смонтированный оверлей Radix. Если блокировка есть, а оверлеев
 * нет — блокировка «зависла», снимаем её.
 */
const OVERLAY_SELECTOR = [
  "[data-radix-popper-content-wrapper]", // dropdown / select / popover / context-menu / menubar / hovercard / tooltip
  "[data-radix-menu-content]",
  "[data-radix-select-content]",
  "[data-radix-popover-content]",
  '[role="menu"]',
  '[role="listbox"]',
  '[role="dialog"]',
  '[role="alertdialog"]',
].join(",");

const PointerEventsGuard = () => {
  useEffect(() => {
    const unlockIfStuck = () => {
      // Дёшево: если тело не заблокировано — мгновенно выходим.
      if (document.body.style.pointerEvents !== "none") return;
      // Легитимная блокировка: оверлей всё ещё смонтирован — не трогаем.
      if (document.querySelector(OVERLAY_SELECTOR)) return;
      // Блокировка «зависла» без единого оверлея — снимаем.
      document.body.style.pointerEvents = "";
    };

    // Мгновенная реакция, когда Radix меняет inline-стиль на body.
    const styleObserver = new MutationObserver(unlockIfStuck);
    styleObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Запасной таймер: ловит случай, когда оверлей размонтировался, а тело
    // осталось none без новой мутации стиля (none → none не порождает событий).
    // Проверка почти бесплатна — querySelector выполняется лишь при блокировке.
    const interval = window.setInterval(unlockIfStuck, 250);

    return () => {
      styleObserver.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
};

export default PointerEventsGuard;
