from django.contrib.auth import get_user_model
from cafeterias.models import Menu
from reviews.models import Review


def run():
    User = get_user_model()

    # student1 ~ student10
    usernames = [f"student{i}" for i in range(1, 11)]
    users = list(User.objects.filter(username__in=usernames).order_by("username"))

    # 모든 메뉴 로드 (Menu 전체)
    menus = list(Menu.objects.select_related("cafeteria").order_by("id"))

    print("유저:", [u.username for u in users])
    print("메뉴 개수:", len(menus))

    if not users:
        print("⚠ student1~10 유저가 없습니다.")
        return
    if not menus:
        print("⚠ Menu 테이블에 메뉴가 없습니다.")
        return

    # -----------------------------
    # 식당별 평점 정책
    # -----------------------------
    LOW_STORE = {12}              # 51장국밥 → 평균 3.0대
    HIGH_STORE = {10, 11, 19}     # 바비든든, 값찌개, 포포420 → 평균 4.8대

    # 🔹 저평점(3.0~3.3)
    rating_low_strong = [3, 3, 3, 3, 3, 3, 3, 3, 4, 3]  # 평균 3.1~3.2

    # 🔹 고평점(4.7~4.9)
    rating_high_strong = [5, 5, 5, 5, 5, 5, 5, 4, 5, 5]  # 평균 4.8

    # 기본 패턴 (기존 유지)
    rating_high = [5, 5, 5, 5, 5, 5, 4, 4, 4, 4]  # 4.6
    rating_mid  = [5, 4, 4, 4, 4, 4, 4, 4, 4, 5]  # 4.2
    rating_low  = [4, 4, 4, 4, 4, 4, 4, 4, 3, 3]  # 3.8

    def get_rating(menu, menu_idx, user_idx):
        store_id = menu.cafeteria_id

        # 1) 저평점 매장
        if store_id in LOW_STORE:
            return rating_low_strong[user_idx]

        # 2) 고평점 매장
        if store_id in HIGH_STORE:
            return rating_high_strong[user_idx]

        # 3) 기본 패턴 (menu_idx % 3)
        group = menu_idx % 3
        if group == 0:
            return rating_high[user_idx]
        elif group == 1:
            return rating_mid[user_idx]
        else:
            return rating_low[user_idx]

    def make_comment(menu, rating, user):
        if rating == 5:
            tail = "정말 만족스러웠고 다음에도 다시 먹고 싶은 메뉴였습니다."
        elif rating == 4:
            tail = "전체적으로 맛있었고 가격 대비 만족도가 높았습니다."
        elif rating == 3:
            tail = "그럭저럭 먹을 만했지만, 크게 인상 깊지는 않았습니다."
        elif rating == 2:
            tail = "조금 아쉬운 부분이 있어서 다음에는 다른 메뉴를 선택할 것 같습니다."
        else:
            tail = "제 입맛에는 잘 맞지 않아서 다시 주문하진 않을 것 같습니다."
        return f"{menu.name}을(를) 먹어보았습니다. {tail}"

    # -----------------------------------------
    # 리뷰 생성
    # -----------------------------------------
    created = 0
    skipped = []

    for user_idx, user in enumerate(users):
        for menu_idx, menu in enumerate(menus):
            rating = get_rating(menu, menu_idx, user_idx)
            content = make_comment(menu, rating, user)

            try:
                Review.objects.create(
                    menu=menu,
                    author=user,
                    rating=rating,
                    content=content,
                )
                created += 1
            except Exception as e:
                skipped.append({
                    "reason": str(e),
                    "menu_id": menu.id,
                    "menu_name": menu.name,
                    "username": user.username,
                })

    print("생성된 리뷰 개수:", created)
    print("스킵된 리뷰 개수:", len(skipped))
    if skipped:
        print("스킵 예시:", skipped[:5])


if __name__ == "__main__":
    run()