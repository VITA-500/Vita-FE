import { routes } from "@/shared/constants/routes";
import { ButtonLink } from "@/shared/ui/Button";

const NotFound = () => {
  return (
    <main className="bg-background flex min-h-[calc(100vh-64px)] items-center justify-center px-6 text-gray-950 transition-colors dark:bg-black dark:text-white">
      <section className="text-center">
        <p className="text-brand text-8xl font-extrabold sm:text-9xl">404</p>

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          페이지를 찾을 수 없습니다
        </h1>

        <p className="mt-5 text-sm leading-7 text-gray-600 dark:text-gray-400">
          요청하신 페이지가 존재하지 않거나 이동되었어요.
          <br />
          홈으로 돌아가 다시 시작해보세요.
        </p>

        <ButtonLink
          href={routes.home}
          size="md"
          className="shadow-brand/25 mt-8 inline-flex items-center justify-center px-6 py-4 text-sm font-bold shadow-xl"
        >
          홈으로 돌아가기
        </ButtonLink>
      </section>
    </main>
  );
};

export default NotFound;
